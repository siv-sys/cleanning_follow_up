-- =============================================================================
-- 003 · Row Level Security + table/column privileges
-- Principle: deny by default. anon gets nothing; authenticated gets only the
-- verbs and columns each role actually needs, filtered by policies.
-- =============================================================================

alter table public.profiles             enable row level security;
alter table public.classes              enable row level security;
alter table public.class_teachers       enable row level security;
alter table public.class_students       enable row level security;
alter table public.cleaning_tasks       enable row level security;
alter table public.cleaning_submissions enable row level security;
alter table public.submission_reviews   enable row level security;

-- Start from zero privileges, then grant precisely.
revoke all on public.profiles, public.classes, public.class_teachers, public.class_students,
              public.cleaning_tasks, public.cleaning_submissions, public.submission_reviews
  from anon, authenticated;

grant select on public.profiles, public.classes, public.class_teachers, public.class_students,
               public.cleaning_tasks, public.cleaning_submissions, public.submission_reviews
  to authenticated;

-- Users may edit only their display name. role/email/id are not grantable.
grant update (full_name) on public.profiles to authenticated;

-- Admin-managed tables (policies below restrict these verbs to admins).
grant insert, update, delete on public.classes, public.class_teachers, public.class_students
  to authenticated;
grant insert (class_id, assigned_student_id, title, description, location, scheduled_for, due_at, allow_resubmission),
      update (class_id, assigned_student_id, title, description, location, scheduled_for, due_at, allow_resubmission),
      delete
  on public.cleaning_tasks to authenticated;

-- Students insert submissions; only these columns are accepted from clients.
-- No UPDATE / DELETE grant at all: status and submitted_at are server-owned.
grant insert (task_id, photo_path, student_note) on public.cleaning_submissions to authenticated;

-- Reviewers insert reviews; reviewer_id / created_at are set by trigger.
grant insert (submission_id, decision, comment) on public.submission_reviews to authenticated;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
    or (role = 'student' and private.teaches_student(id))
    or (role = 'teacher' and private.is_my_teacher(id))
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- classes
-- -----------------------------------------------------------------------------
create policy classes_select on public.classes
  for select to authenticated
  using (private.is_admin() or private.teaches_class(id) or private.in_class(id));

create policy classes_admin_insert on public.classes
  for insert to authenticated with check (private.is_admin());
create policy classes_admin_update on public.classes
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy classes_admin_delete on public.classes
  for delete to authenticated using (private.is_admin());

-- -----------------------------------------------------------------------------
-- class_teachers
-- -----------------------------------------------------------------------------
create policy class_teachers_select on public.class_teachers
  for select to authenticated
  using (
    private.is_admin()
    or teacher_id = (select auth.uid())
    or private.in_class(class_id)
  );

create policy class_teachers_admin_insert on public.class_teachers
  for insert to authenticated with check (private.is_admin());
create policy class_teachers_admin_update on public.class_teachers
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy class_teachers_admin_delete on public.class_teachers
  for delete to authenticated using (private.is_admin());

-- -----------------------------------------------------------------------------
-- class_students
-- -----------------------------------------------------------------------------
create policy class_students_select on public.class_students
  for select to authenticated
  using (
    private.is_admin()
    or student_id = (select auth.uid())
    or private.teaches_class(class_id)
  );

create policy class_students_admin_insert on public.class_students
  for insert to authenticated with check (private.is_admin());
create policy class_students_admin_update on public.class_students
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy class_students_admin_delete on public.class_students
  for delete to authenticated using (private.is_admin());

-- -----------------------------------------------------------------------------
-- cleaning_tasks
-- -----------------------------------------------------------------------------
create policy cleaning_tasks_select on public.cleaning_tasks
  for select to authenticated
  using (
    private.is_admin()
    or private.teaches_class(class_id)
    or private.task_assigned_to_me(id)
  );

create policy cleaning_tasks_admin_insert on public.cleaning_tasks
  for insert to authenticated with check (private.is_admin());
create policy cleaning_tasks_admin_update on public.cleaning_tasks
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy cleaning_tasks_admin_delete on public.cleaning_tasks
  for delete to authenticated using (private.is_admin());

-- -----------------------------------------------------------------------------
-- cleaning_submissions
-- -----------------------------------------------------------------------------
create policy cleaning_submissions_select on public.cleaning_submissions
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or private.is_admin()
    or private.teaches_task(task_id)
  );

-- The trigger forces student_id := auth.uid(); this check is defence in depth.
create policy cleaning_submissions_student_insert on public.cleaning_submissions
  for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and private.current_app_role() = 'student'
    and private.task_assigned_to_me(task_id)
  );

-- -----------------------------------------------------------------------------
-- submission_reviews
-- -----------------------------------------------------------------------------
create policy submission_reviews_select on public.submission_reviews
  for select to authenticated
  using (private.can_access_submission(submission_id));

create policy submission_reviews_insert on public.submission_reviews
  for insert to authenticated
  with check (
    reviewer_id = (select auth.uid())
    and private.can_review_submission(submission_id)
  );

-- -----------------------------------------------------------------------------
-- Read model for dashboards / filtering. security_invoker = true means the
-- caller's RLS applies to every joined table, so this exposes nothing extra.
-- -----------------------------------------------------------------------------
create view public.submission_details
with (security_invoker = true)
as
select
  s.id,
  s.task_id,
  s.student_id,
  s.photo_path,
  s.student_note,
  s.status,
  s.submitted_at,
  s.reviewed_at,
  (s.submitted_at > t.due_at) as is_late,
  t.title          as task_title,
  t.location       as task_location,
  t.due_at         as task_due_at,
  t.scheduled_for  as task_scheduled_for,
  t.class_id,
  c.name           as class_name,
  st.full_name     as student_name,
  st.email         as student_email,
  lr.comment       as latest_comment,
  lr.reviewer_id   as latest_reviewer_id,
  rv.full_name     as latest_reviewer_name
from public.cleaning_submissions s
join public.cleaning_tasks t on t.id = s.task_id
join public.classes c        on c.id = t.class_id
left join public.profiles st on st.id = s.student_id
left join lateral (
  select r.comment, r.reviewer_id
  from public.submission_reviews r
  where r.submission_id = s.id
  order by r.created_at desc
  limit 1
) lr on true
left join public.profiles rv on rv.id = lr.reviewer_id;

revoke all on public.submission_details from anon, authenticated;
grant select on public.submission_details to authenticated;
