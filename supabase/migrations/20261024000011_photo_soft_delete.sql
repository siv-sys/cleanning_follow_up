-- =============================================================================
-- 011 · Photo removal
--   * Students / supervisors "delete" their own photo => it is only hidden
--     (deleted_at set). The row and the file are kept.
--   * Hidden photos are invisible to everyone except admins.
--   * Only admins can delete permanently (row + file) or restore a hidden photo.
-- =============================================================================

alter table public.daily_photos
  add column deleted_at timestamptz,
  add column deleted_by uuid references public.profiles (id) on delete set null;

create index daily_photos_deleted_idx on public.daily_photos (deleted_at) where deleted_at is not null;

-- -----------------------------------------------------------------------------
-- Soft delete / restore via RPC (clients have no UPDATE grant on the table).
-- -----------------------------------------------------------------------------
create or replace function public.hide_daily_photo(p_photo_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.daily_photos
     set deleted_at = clock_timestamp(),
         deleted_by = (select auth.uid())
   where id = p_photo_id
     and deleted_at is null
     and (student_id = (select auth.uid()) or private.is_admin());
  if not found then
    raise exception 'photo not found or you cannot remove it' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.restore_daily_photo(p_photo_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'only administrators can restore photos' using errcode = '42501';
  end if;
  update public.daily_photos set deleted_at = null, deleted_by = null where id = p_photo_id;
end;
$$;

revoke all on function public.hide_daily_photo(uuid), public.restore_daily_photo(uuid) from public, anon;
grant execute on function public.hide_daily_photo(uuid), public.restore_daily_photo(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- RLS: hidden photos are admin-only; hard delete is admin-only.
-- -----------------------------------------------------------------------------
drop policy daily_photos_select on public.daily_photos;
create policy daily_photos_select on public.daily_photos
  for select to authenticated
  using (
    private.is_admin()
    or (
      deleted_at is null
      and (
        student_id = (select auth.uid())
        or private.is_teacher()
        or private.supervises(student_id)
      )
    )
  );

drop policy daily_photos_owner_delete on public.daily_photos;
create policy daily_photos_admin_delete on public.daily_photos
  for delete to authenticated
  using (private.is_admin());

-- -----------------------------------------------------------------------------
-- Storage: hidden files can't be fetched by non-admins; admins can delete files.
-- -----------------------------------------------------------------------------
drop policy daily_photos_storage_select on storage.objects;
create policy daily_photos_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'daily-photos'
    and (
      private.is_admin()
      or (
        (
          split_part(name, '/', 1) = (select auth.uid())::text
          or private.is_teacher()
          or private.supervises(private.try_uuid(split_part(name, '/', 1)))
        )
        and not exists (
          select 1 from public.daily_photos d
          where d.photo_path = name and d.deleted_at is not null
        )
      )
    )
  );

create policy daily_photos_storage_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'daily-photos' and private.is_admin());

-- -----------------------------------------------------------------------------
-- Overview counts only visible photos.
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
  where d.student_id = p.id and d.deleted_at is null
) ph on true
where p.role in ('student', 'supervisor');
