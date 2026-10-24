-- =============================================================================
-- 010 · Supervisor permissions
--   * A supervisor is a house member like a student: they belong to one house
--     and upload their own daily photos.
--   * In addition, they can see the members and photos of THEIR OWN house.
--   * They cannot manage houses or see other houses' members.
-- "House member" below means role student or supervisor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function private.is_house_member_role(p_role public.app_role)
returns boolean
language sql immutable
set search_path = ''
as $$
  select p_role in ('student', 'supervisor');
$$;

-- Is the caller a supervisor in the same house as the given user?
create or replace function private.supervises(p_user_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles me
    join public.house_students mine   on mine.student_id = me.id
    join public.house_students theirs on theirs.house_id = mine.house_id
    where me.id = (select auth.uid())
      and me.role = 'supervisor'
      and theirs.student_id = p_user_id
  );
$$;

-- Is the caller a supervisor of the given house?
create or replace function private.supervises_house(p_house_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles me
    join public.house_students mine on mine.student_id = me.id
    where me.id = (select auth.uid())
      and me.role = 'supervisor'
      and mine.house_id = p_house_id
  );
$$;

revoke all on function private.is_house_member_role(public.app_role), private.supervises(uuid),
                       private.supervises_house(uuid) from public;
grant execute on function private.is_house_member_role(public.app_role), private.supervises(uuid),
                          private.supervises_house(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Triggers: supervisors can be placed in houses and upload photos
-- -----------------------------------------------------------------------------
create or replace function private.check_house_member()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.student_id and private.is_house_member_role(role)
  ) then
    raise exception 'only students and supervisors can be placed in a house' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger house_students_check on public.house_students;
create trigger house_students_check
  before insert or update on public.house_students
  for each row execute function private.check_house_member();

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

  if not exists (
    select 1 from public.profiles
    where id = new.student_id and private.is_house_member_role(role)
  ) then
    raise exception 'only students and supervisors can upload photos' using errcode = '42501';
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

-- Leaving the house only when the user stops being a house member
-- (student <-> supervisor keeps the house).
drop trigger profiles_leave_house on public.profiles;
create trigger profiles_leave_house
  after update of role on public.profiles
  for each row
  when (private.is_house_member_role(old.role) and not private.is_house_member_role(new.role))
  execute function private.leave_house_on_role_change();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
    or (private.is_house_member_role(role) and private.is_teacher())
    or (role = 'student' and private.teaches_student(id))
    or (role = 'teacher' and private.is_my_teacher(id))
    or private.supervises(id)
  );

drop policy house_students_select on public.house_students;
create policy house_students_select on public.house_students
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or private.is_admin()
    or private.is_teacher()
    or private.supervises_house(house_id)
  );

drop policy daily_photos_select on public.daily_photos;
create policy daily_photos_select on public.daily_photos
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or private.is_admin()
    or private.is_teacher()
    or private.supervises(student_id)
  );

drop policy daily_photos_student_insert on public.daily_photos;
create policy daily_photos_member_insert on public.daily_photos
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and private.is_house_member_role(private.current_app_role())
    and private.in_a_house()
  );

-- -----------------------------------------------------------------------------
-- Storage
-- -----------------------------------------------------------------------------
drop policy daily_photos_storage_insert on storage.objects;
create policy daily_photos_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'daily-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and private.is_house_member_role(private.current_app_role())
    and private.in_a_house()
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    and array_length(string_to_array(name, '/'), 1) = 2
  );

drop policy daily_photos_storage_select on storage.objects;
create policy daily_photos_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'daily-photos'
    and (
      split_part(name, '/', 1) = (select auth.uid())::text
      or private.is_admin()
      or private.is_teacher()
      or private.supervises(private.try_uuid(split_part(name, '/', 1)))
    )
  );

-- -----------------------------------------------------------------------------
-- Read model: include supervisors, and expose the role.
-- (create or replace can only append columns, so role goes last.)
-- -----------------------------------------------------------------------------
create or replace view public.student_overview
with (security_invoker = true)
as
select
  p.id          as student_id,
  p.full_name,
  p.email,
  hs.house_id,
  h.name        as house_name,
  coalesce(ph.photo_count, 0)::int as photo_count,
  ph.last_photo_at,
  p.role
from public.profiles p
left join public.house_students hs on hs.student_id = p.id
left join public.houses h          on h.id = hs.house_id
left join lateral (
  select count(*) as photo_count, max(d.created_at) as last_photo_at
  from public.daily_photos d
  where d.student_id = p.id
) ph on true
where p.role in ('student', 'supervisor');
