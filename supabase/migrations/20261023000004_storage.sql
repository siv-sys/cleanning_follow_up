-- =============================================================================
-- 004 · Private photo bucket + Storage policies
-- Object path convention: {student_id}/{task_id}/{random}.{ext}
-- File size and MIME type are enforced by the bucket itself (server side).
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cleaning-photos',
  'cleaning-photos',
  false,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.try_uuid(p text)
returns uuid
language plpgsql immutable
set search_path = ''
as $$
begin
  return p::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

grant execute on function private.try_uuid(text) to authenticated;

-- Students upload only into {their id}/{a task assigned to them}/, images only.
create policy cleaning_photos_student_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cleaning-photos'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and private.current_app_role() = 'student'
    and private.task_assigned_to_me(private.try_uuid(split_part(name, '/', 2)))
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    and array_length(string_to_array(name, '/'), 1) = 3
  );

-- Owner, admins, and teachers of the task's class (only once it is submitted).
create policy cleaning_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'cleaning-photos' and private.can_read_photo(name));

-- Owners may delete only orphaned uploads (never a submitted photo).
create policy cleaning_photos_delete_orphan on storage.objects
  for delete to authenticated
  using (bucket_id = 'cleaning-photos' and private.can_delete_photo(name));

-- No UPDATE policy: submitted photos cannot be overwritten.
