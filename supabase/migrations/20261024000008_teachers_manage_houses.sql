-- =============================================================================
-- 008 · Teachers can create houses and manage house membership.
-- Renaming and deleting houses stays admin-only.
-- =============================================================================

drop policy houses_admin_insert on public.houses;
create policy houses_staff_insert on public.houses
  for insert to authenticated
  with check (private.is_admin() or private.is_teacher());

drop policy house_students_admin_insert on public.house_students;
drop policy house_students_admin_update on public.house_students;
drop policy house_students_admin_delete on public.house_students;

create policy house_students_staff_insert on public.house_students
  for insert to authenticated
  with check (private.is_admin() or private.is_teacher());
create policy house_students_staff_update on public.house_students
  for update to authenticated
  using (private.is_admin() or private.is_teacher())
  with check (private.is_admin() or private.is_teacher());
create policy house_students_staff_delete on public.house_students
  for delete to authenticated
  using (private.is_admin() or private.is_teacher());
