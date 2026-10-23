-- =============================================================================
-- 002 · Security helpers (private schema, not exposed over the API) and
--       integrity triggers that make server-controlled fields tamper-proof.
-- =============================================================================

create schema if not exists private;
grant usage on schema private to authenticated;

-- -----------------------------------------------------------------------------
-- Role / scope helpers. SECURITY DEFINER so they can read membership tables
-- without recursing through RLS; they only ever answer about auth.uid().
-- -----------------------------------------------------------------------------
create or replace function private.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function private.teaches_class(p_class_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_teachers ct
    join public.profiles p on p.id = ct.teacher_id and p.role = 'teacher'
    where ct.class_id = p_class_id and ct.teacher_id = (select auth.uid())
  );
$$;

create or replace function private.in_class(p_class_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.class_students cs
    where cs.class_id = p_class_id and cs.student_id = (select auth.uid())
  );
$$;

-- Teacher of any class the given student belongs to.
create or replace function private.teaches_student(p_student_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_students cs
    join public.class_teachers ct on ct.class_id = cs.class_id
    join public.profiles p on p.id = ct.teacher_id and p.role = 'teacher'
    where cs.student_id = p_student_id and ct.teacher_id = (select auth.uid())
  );
$$;

-- Student of any class the given teacher teaches (lets students see their teachers' names).
create or replace function private.is_my_teacher(p_teacher_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.class_teachers ct
    join public.class_students cs on cs.class_id = ct.class_id
    where ct.teacher_id = p_teacher_id and cs.student_id = (select auth.uid())
  );
$$;

-- Is the task assigned to the calling student?
create or replace function private.task_assigned_to_me(p_task_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.cleaning_tasks t
    join public.class_students cs
      on cs.class_id = t.class_id and cs.student_id = (select auth.uid())
    where t.id = p_task_id
      and (t.assigned_student_id is null or t.assigned_student_id = (select auth.uid()))
  );
$$;

-- Does the caller teach the class that owns the task?
create or replace function private.teaches_task(p_task_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cleaning_tasks t
    where t.id = p_task_id and private.teaches_class(t.class_id)
  );
$$;

-- Can the caller see this submission (and therefore its photo / reviews)?
create or replace function private.can_access_submission(p_submission_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cleaning_submissions s
    where s.id = p_submission_id
      and (
        s.student_id = (select auth.uid())
        or private.is_admin()
        or private.teaches_task(s.task_id)
      )
  );
$$;

-- Can the caller review (approve/reject) this submission?
create or replace function private.can_review_submission(p_submission_id uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.cleaning_submissions s
    where s.id = p_submission_id
      and (private.is_admin() or private.teaches_task(s.task_id))
  );
$$;

-- Storage: may the caller read this object?
create or replace function private.can_read_photo(p_object_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    split_part(p_object_name, '/', 1) = (select auth.uid())::text
    or exists (
      select 1 from public.cleaning_submissions s
      where s.photo_path = p_object_name
        and (private.is_admin() or private.teaches_task(s.task_id))
    );
$$;

-- Storage: may the caller remove this object? Only their own, and only while
-- no submission references it (i.e. cleaning up a failed/abandoned upload).
create or replace function private.can_delete_photo(p_object_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    split_part(p_object_name, '/', 1) = (select auth.uid())::text
    and not exists (
      select 1 from public.cleaning_submissions s where s.photo_path = p_object_name
    );
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- -----------------------------------------------------------------------------
-- New auth user -> profile. Role is always 'student'; metadata is only used
-- for the display name, never for privileges.
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  v_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120);
  if v_name = '' then
    v_name := left(split_part(coalesce(new.email, 'user'), '@', 1), 120);
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (new.id, coalesce(new.email, ''), v_name, 'student');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.handle_user_email_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- profiles: role and email may only change through trusted paths
-- (admin RPC in 005, auth trigger above). Column grants in 003 already block
-- API callers; this trigger also blocks it for any other non-trusted caller.
-- -----------------------------------------------------------------------------
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id then
    raise exception 'profile id cannot change' using errcode = '42501';
  end if;
  if new.role is distinct from old.role
     and coalesce(current_setting('app.trusted_role_change', true), '') <> 'on' then
    raise exception 'role can only be changed by an administrator' using errcode = '42501';
  end if;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function private.guard_profile_update();

-- -----------------------------------------------------------------------------
-- Membership integrity: teachers must be teachers, students must be students.
-- -----------------------------------------------------------------------------
create or replace function private.check_class_teacher()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = new.teacher_id and role = 'teacher') then
    raise exception 'user is not a teacher' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger class_teachers_check
  before insert or update on public.class_teachers
  for each row execute function private.check_class_teacher();

create or replace function private.check_class_student()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = new.student_id and role = 'student') then
    raise exception 'user is not a student' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger class_students_check
  before insert or update on public.class_students
  for each row execute function private.check_class_student();

-- -----------------------------------------------------------------------------
-- Tasks: individually-assigned student must be in the task's class.
-- -----------------------------------------------------------------------------
create or replace function private.check_cleaning_task()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce((select auth.uid()), new.created_by);
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if new.assigned_student_id is not null and not exists (
    select 1 from public.class_students
    where class_id = new.class_id and student_id = new.assigned_student_id
  ) then
    raise exception 'assigned student is not enrolled in this class' using errcode = '23514';
  end if;

  if new.due_at < new.scheduled_for::timestamptz then
    raise exception 'deadline cannot be before the scheduled cleaning date' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger cleaning_tasks_check
  before insert or update on public.cleaning_tasks
  for each row execute function private.check_cleaning_task();

create or replace function private.stamp_class_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce((select auth.uid()), new.created_by);
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger classes_stamp_creator
  before insert or update on public.classes
  for each row execute function private.stamp_class_creator();

-- -----------------------------------------------------------------------------
-- Submissions: the server owns student_id, status and the official timestamp.
-- -----------------------------------------------------------------------------
create or replace function private.prepare_submission()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_task public.cleaning_tasks%rowtype;
begin
  -- Identity comes from the JWT, never from the payload.
  if (select auth.uid()) is not null then
    new.student_id := (select auth.uid());
  end if;

  -- Official, trusted values. Client-supplied values are discarded.
  new.submitted_at := clock_timestamp();
  new.status       := 'pending';
  new.reviewed_at  := null;

  if not exists (select 1 from public.profiles where id = new.student_id and role = 'student') then
    raise exception 'only students can submit cleaning photos' using errcode = '42501';
  end if;

  select * into v_task from public.cleaning_tasks where id = new.task_id;
  if not found then
    raise exception 'task not found' using errcode = '23503';
  end if;

  if not exists (
    select 1 from public.class_students
    where class_id = v_task.class_id and student_id = new.student_id
  ) or (v_task.assigned_student_id is not null and v_task.assigned_student_id <> new.student_id) then
    raise exception 'this task is not assigned to you' using errcode = '42501';
  end if;

  if new.photo_path not like new.student_id::text || '/' || new.task_id::text || '/%' then
    raise exception 'photo must be uploaded to your own task folder' using errcode = '23514';
  end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'cleaning-photos' and name = new.photo_path
  ) then
    raise exception 'photo upload not found' using errcode = '23514';
  end if;

  -- Serialise concurrent submissions for the same student+task.
  perform pg_advisory_xact_lock(hashtextextended(new.task_id::text || ':' || new.student_id::text, 0));

  if exists (
    select 1 from public.cleaning_submissions
    where task_id = new.task_id and student_id = new.student_id
      and status in ('pending', 'approved')
  ) then
    raise exception 'you already have a pending or approved submission for this task'
      using errcode = '23505';
  end if;

  if not v_task.allow_resubmission and exists (
    select 1 from public.cleaning_submissions
    where task_id = new.task_id and student_id = new.student_id
  ) then
    raise exception 'this task does not allow resubmission' using errcode = '23505';
  end if;

  return new;
end;
$$;

create trigger cleaning_submissions_prepare
  before insert on public.cleaning_submissions
  for each row execute function private.prepare_submission();

create or replace function private.guard_submission_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id           is distinct from old.id
  or new.task_id      is distinct from old.task_id
  or new.student_id   is distinct from old.student_id
  or new.photo_path   is distinct from old.photo_path
  or new.student_note is distinct from old.student_note
  or new.submitted_at is distinct from old.submitted_at then
    raise exception 'submission details and the official timestamp cannot be modified'
      using errcode = '42501';
  end if;

  if (new.status is distinct from old.status or new.reviewed_at is distinct from old.reviewed_at)
     and coalesce(current_setting('app.applying_review', true), '') <> 'on' then
    raise exception 'status changes only through a review' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger cleaning_submissions_guard_update
  before update on public.cleaning_submissions
  for each row execute function private.guard_submission_update();

-- -----------------------------------------------------------------------------
-- Reviews: server sets reviewer + time; inserting a review sets the status.
-- -----------------------------------------------------------------------------
create or replace function private.prepare_review()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_sub public.cleaning_submissions%rowtype;
begin
  if (select auth.uid()) is not null then
    new.reviewer_id := (select auth.uid());
  end if;
  new.created_at := clock_timestamp();

  select * into v_sub from public.cleaning_submissions where id = new.submission_id for update;
  if not found then
    raise exception 'submission not found' using errcode = '23503';
  end if;

  if (select auth.uid()) is not null and not private.can_review_submission(new.submission_id) then
    raise exception 'you cannot review this submission' using errcode = '42501';
  end if;

  -- Only the latest attempt for a student+task can be (re)reviewed, so at most
  -- one attempt can ever be live.
  if exists (
    select 1 from public.cleaning_submissions s
    where s.task_id = v_sub.task_id and s.student_id = v_sub.student_id
      and s.submitted_at > v_sub.submitted_at
  ) then
    raise exception 'a newer attempt exists; review that one instead' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger submission_reviews_prepare
  before insert on public.submission_reviews
  for each row execute function private.prepare_review();

create or replace function private.apply_review()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  perform set_config('app.applying_review', 'on', true);
  update public.cleaning_submissions
     set status = new.decision::text::public.submission_status,
         reviewed_at = new.created_at
   where id = new.submission_id;
  perform set_config('app.applying_review', 'off', true);
  return new;
end;
$$;

create trigger submission_reviews_apply
  after insert on public.submission_reviews
  for each row execute function private.apply_review();

create or replace function private.block_review_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'review history is append-only' using errcode = '42501';
end;
$$;

create trigger submission_reviews_immutable
  before update on public.submission_reviews
  for each row execute function private.block_review_changes();
