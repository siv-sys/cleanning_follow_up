-- =============================================================================
-- 006 · Houses (student groups) and daily photo uploads
--   * Every student belongs to at most one house (admin-managed).
--   * Students upload photos with a description, day by day.
--   * Teachers can see every house, student and photo, but cannot upload.
-- Object path convention for photos: {student_id}/{random}.{ext}
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.houses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(btrim(name)) between 1 and 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger houses_set_updated_at
  before update on public.houses
  for each row execute function public.set_updated_at();

-- student_id is the primary key, so a student can be in only one house.
create table public.house_students (
  student_id  uuid primary key references public.profiles (id) on delete cascade,
  house_id    uuid not null references public.houses (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index house_students_house_idx on public.house_students (house_id);

-- Reuses the "must be a student" check from 002 (it only looks at new.student_id).
create trigger house_students_check
  before insert or update on public.house_students
  for each row execute function private.check_class_student();

create table public.daily_photos (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references public.profiles (id) on delete cascade,
  photo_path   text not null unique check (char_length(photo_path) <= 300),
  description  text not null check (char_length(btrim(description)) between 1 and 1000),
  created_at   timestamptz not null default now()
);

create index daily_photos_student_idx on public.daily_photos (student_id, created_at desc);
create index daily_photos_created_idx on public.daily_photos (created_at desc);

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function private.is_teacher()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  );
$$;

create or replace function private.in_a_house()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.house_students where student_id = (select auth.uid()));
$$;

revoke all on function private.is_teacher(), private.in_a_house() from public;
grant execute on function private.is_teacher(), private.in_a_house() to authenticated;

-- -----------------------------------------------------------------------------
-- Integrity triggers
-- -----------------------------------------------------------------------------

-- Server owns student_id and the timestamp; the photo must already be uploaded
-- into the student's own folder.
create or replace function private.prepare_daily_photo()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    new.student_id := (select auth.uid());
  end if;
  new.created_at  := clock_timestamp();
  new.description := btrim(new.description);

  if not exists (select 1 from public.profiles where id = new.student_id and role = 'student') then
    raise exception 'only students can upload photos' using errcode = '42501';
  end if;

  if not exists (select 1 from public.house_students where student_id = new.student_id) then
    raise exception 'you have not been placed in a house yet' using errcode = '42501';
  end if;

  if new.photo_path not like new.student_id::text || '/%' then
    raise exception 'photo must be uploaded to your own folder' using errcode = '23514';
  end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'daily-photos' and name = new.photo_path
  ) then
    raise exception 'photo upload not found' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger daily_photos_prepare
  before insert on public.daily_photos
  for each row execute function private.prepare_daily_photo();

-- A user who stops being a student leaves their house.
create or replace function private.leave_house_on_role_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  delete from public.house_students where student_id = new.id;
  return new;
end;
$$;

create trigger profiles_leave_house
  after update of role on public.profiles
  for each row
  when (old.role = 'student' and new.role <> 'student')
  execute function private.leave_house_on_role_change();

-- -----------------------------------------------------------------------------
-- Privileges + RLS
-- -----------------------------------------------------------------------------
alter table public.houses         enable row level security;
alter table public.house_students enable row level security;
alter table public.daily_photos   enable row level security;

revoke all on public.houses, public.house_students, public.daily_photos from anon, authenticated;

grant select on public.houses, public.house_students, public.daily_photos to authenticated;
grant insert (name), update (name), delete on public.houses to authenticated;
-- update(student_id) is needed because upsert's ON CONFLICT DO UPDATE sets every
-- inserted column; policies still restrict all writes to admins.
grant insert (student_id, house_id), update (student_id, house_id), delete on public.house_students to authenticated;
-- No UPDATE on photos: a photo and its timestamp cannot be edited.
grant insert (photo_path, description), delete on public.daily_photos to authenticated;

-- houses: names are visible to every signed-in user; admins manage them.
create policy houses_select on public.houses
  for select to authenticated using (true);
create policy houses_admin_insert on public.houses
  for insert to authenticated with check (private.is_admin());
create policy houses_admin_update on public.houses
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy houses_admin_delete on public.houses
  for delete to authenticated using (private.is_admin());

-- house_students: staff see all; a student sees their own membership.
create policy house_students_select on public.house_students
  for select to authenticated
  using (student_id = (select auth.uid()) or private.is_admin() or private.is_teacher());
create policy house_students_admin_insert on public.house_students
  for insert to authenticated with check (private.is_admin());
create policy house_students_admin_update on public.house_students
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy house_students_admin_delete on public.house_students
  for delete to authenticated using (private.is_admin());

-- daily_photos: owner + staff read; only students in a house insert; owner deletes.
create policy daily_photos_select on public.daily_photos
  for select to authenticated
  using (student_id = (select auth.uid()) or private.is_admin() or private.is_teacher());
create policy daily_photos_student_insert on public.daily_photos
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and private.current_app_role() = 'student'
    and private.in_a_house()
  );
create policy daily_photos_owner_delete on public.daily_photos
  for delete to authenticated
  using (student_id = (select auth.uid()));

-- Teachers can now see every student (needed to browse houses).
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
    or (role = 'student' and (private.is_teacher() or private.teaches_student(id)))
    or (role = 'teacher' and private.is_my_teacher(id))
  );

-- -----------------------------------------------------------------------------
-- Read model: one row per student with house + photo stats.
-- security_invoker = true, so the caller's RLS applies to every table.
-- -----------------------------------------------------------------------------
create view public.student_overview
with (security_invoker = true)
as
select
  p.id          as student_id,
  p.full_name,
  p.email,
  hs.house_id,
  h.name        as house_name,
  coalesce(ph.photo_count, 0)::int as photo_count,
  ph.last_photo_at
from public.profiles p
left join public.house_students hs on hs.student_id = p.id
left join public.houses h          on h.id = hs.house_id
left join lateral (
  select count(*) as photo_count, max(d.created_at) as last_photo_at
  from public.daily_photos d
  where d.student_id = p.id
) ph on true
where p.role = 'student';

revoke all on public.student_overview from anon, authenticated;
grant select on public.student_overview to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: private bucket for daily photos
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'daily-photos',
  'daily-photos',
  false,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy daily_photos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'daily-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and private.current_app_role() = 'student'
    and private.in_a_house()
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    and array_length(string_to_array(name, '/'), 1) = 2
  );

create policy daily_photos_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'daily-photos'
    and (
      split_part(name, '/', 1) = (select auth.uid())::text
      or private.is_admin()
      or private.is_teacher()
    )
  );

-- Owner may remove an object once no daily_photos row points at it
-- (delete the row first, then the file).
create policy daily_photos_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'daily-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and not exists (select 1 from public.daily_photos d where d.photo_path = name)
  );
