-- =============================================================================
-- RLS / integrity checks. Run in the Supabase SQL editor AFTER the migrations.
-- Everything happens inside one transaction and is ROLLED BACK at the end,
-- so no test users or data are left behind.
--
-- Expected result: a list of "PASS ..." notices and no error.
-- Any "FAIL ..." aborts the script and names the rule that broke.
-- =============================================================================
begin;

-- ---------- helpers (temporary, vanish with the session) ---------------------
create function pg_temp.act_as(p_user uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end $$;

create function pg_temp.act_as_owner() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function pg_temp.expect_ok(p_label text, p_sql text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise notice 'PASS  %', p_label;
exception when others then
  raise exception 'FAIL  % — unexpected error: %', p_label, sqlerrm;
end $$;

create function pg_temp.expect_error(p_label text, p_sql text) returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice 'PASS  % (blocked: %)', p_label, sqlerrm;
    return;
  end;
  raise exception 'FAIL  % — statement was allowed', p_label;
end $$;

create function pg_temp.expect_count(p_label text, p_sql text, p_expected bigint) returns void language plpgsql as $$
declare v bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into v;
  if v <> p_expected then
    raise exception 'FAIL  % — expected % rows, got %', p_label, p_expected, v;
  end if;
  raise notice 'PASS  % (% rows)', p_label, v;
end $$;

-- ---------- fixtures (as table owner) ----------------------------------------
-- a = admin, t1/t2 = teachers, s1/s2 = students
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'rls.admin@test.local',   '{"full_name":"Test Admin"}',     now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'rls.teacher1@test.local','{"full_name":"Test Teacher 1"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'rls.teacher2@test.local','{"full_name":"Test Teacher 2"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000021', 'authenticated', 'authenticated', 'rls.student1@test.local','{"full_name":"Test Student 1","role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000022', 'authenticated', 'authenticated', 'rls.student2@test.local','{"full_name":"Test Student 2"}', now(), now());

do $$ begin
  if (select role from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000021') <> 'student' then
    raise exception 'FAIL  signup metadata "role":"admin" must be ignored';
  end if;
  raise notice 'PASS  new users always start as student (metadata role ignored)';
end $$;

-- Promote via the trusted path (SQL editor = trusted operator).
select set_config('app.trusted_role_change', 'on', true);
update public.profiles set role = 'admin'   where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.profiles set role = 'teacher' where id in ('aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-000000000012');
select set_config('app.trusted_role_change', 'off', true);

insert into public.classes (id, name) values
  ('cccccccc-0000-0000-0000-000000000001', 'RLS Test Class 1'),
  ('cccccccc-0000-0000-0000-000000000002', 'RLS Test Class 2');
insert into public.class_teachers values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000011'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000012');
insert into public.class_students values
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000021'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000022');

insert into public.cleaning_tasks (id, class_id, title, scheduled_for, due_at, allow_resubmission) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'One-shot task',  current_date, now() + interval '1 day', false),
  ('dddddddd-0000-0000-0000-000000000002', 'cccccccc-0000-0000-0000-000000000001', 'Retryable task', current_date, now() + interval '1 day', true),
  ('dddddddd-0000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000002', 'Class 2 task',   current_date, now() + interval '1 day', false);

-- ---------- anon -------------------------------------------------------------
select pg_temp.act_as_anon();
select pg_temp.expect_error('anon cannot read tasks', 'select * from public.cleaning_tasks');
select pg_temp.expect_error('anon cannot read profiles', 'select * from public.profiles');

-- ---------- student 1 --------------------------------------------------------
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000021');
select pg_temp.expect_count('student sees only tasks of own class', 'select 1 from public.cleaning_tasks', 2);
select pg_temp.expect_count('student sees only own profile + own teacher',
  'select 1 from public.profiles', 2);
select pg_temp.expect_error('student cannot change own role',
  $q$update public.profiles set role = 'admin' where id = auth.uid()$q$);
select pg_temp.expect_error('student cannot call admin role RPC',
  $q$select public.admin_set_user_role(auth.uid(), 'admin')$q$);
select pg_temp.expect_ok('student can change own display name',
  $q$update public.profiles set full_name = 'Renamed Student' where id = auth.uid()$q$);
select pg_temp.expect_error('student cannot create classes',
  $q$insert into public.classes (name) values ('Hacked')$q$);
select pg_temp.expect_error('student cannot create tasks',
  $q$insert into public.cleaning_tasks (class_id, title, scheduled_for, due_at)
     values ('cccccccc-0000-0000-0000-000000000001', 'x', current_date, now())$q$);

-- storage uploads
select pg_temp.expect_ok('student uploads photo to own task folder',
  $q$insert into storage.objects (bucket_id, name, owner_id)
     values ('cleaning-photos', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/a.jpg', auth.uid()::text)$q$);
select pg_temp.expect_ok('student uploads photo for retryable task',
  $q$insert into storage.objects (bucket_id, name, owner_id) values
     ('cleaning-photos', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000002/b1.jpg', auth.uid()::text),
     ('cleaning-photos', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000002/b2.jpg', auth.uid()::text)$q$);
select pg_temp.expect_error('student cannot upload into another student''s folder',
  $q$insert into storage.objects (bucket_id, name, owner_id)
     values ('cleaning-photos', 'aaaaaaaa-0000-0000-0000-000000000022/dddddddd-0000-0000-0000-000000000003/x.jpg', auth.uid()::text)$q$);
select pg_temp.expect_error('student cannot upload for a task not assigned to them',
  $q$insert into storage.objects (bucket_id, name, owner_id)
     values ('cleaning-photos', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000003/x.jpg', auth.uid()::text)$q$);
select pg_temp.expect_error('student cannot upload non-image extension',
  $q$insert into storage.objects (bucket_id, name, owner_id)
     values ('cleaning-photos', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/x.exe', auth.uid()::text)$q$);

-- submissions
select pg_temp.expect_error('student cannot supply their own submitted_at',
  $q$insert into public.cleaning_submissions (task_id, photo_path, submitted_at)
     values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/a.jpg', '2000-01-01')$q$);
select pg_temp.expect_error('student cannot supply status',
  $q$insert into public.cleaning_submissions (task_id, photo_path, status)
     values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/a.jpg', 'approved')$q$);
select pg_temp.expect_ok('student submits photo for task',
  $q$insert into public.cleaning_submissions (task_id, photo_path, student_note)
     values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/a.jpg', 'done')$q$);
select pg_temp.expect_count('submission is pending with a server timestamp',
  $q$select 1 from public.cleaning_submissions
     where status = 'pending' and submitted_at > now() - interval '1 minute' and student_id = auth.uid()$q$, 1);
select pg_temp.expect_error('student cannot submit twice for the same task',
  $q$insert into public.cleaning_submissions (task_id, photo_path)
     values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000002/b1.jpg')$q$);
select pg_temp.expect_error('student cannot submit a photo from another task folder',
  $q$insert into public.cleaning_submissions (task_id, photo_path)
     values ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/a.jpg')$q$);
select pg_temp.expect_error('student cannot edit submission timestamp',
  $q$update public.cleaning_submissions set submitted_at = '2000-01-01' where student_id = auth.uid()$q$);
select pg_temp.expect_error('student cannot approve own submission',
  $q$insert into public.submission_reviews (submission_id, decision)
     select id, 'approved' from public.cleaning_submissions where student_id = auth.uid() limit 1$q$);
select pg_temp.expect_error('student cannot delete a submitted photo',
  $q$do $d$ begin
       delete from storage.objects where name = 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/a.jpg';
       if not found then raise exception 'nothing deleted'; end if;
     end $d$$q$);
select pg_temp.expect_ok('student submits retryable task (attempt 1)',
  $q$insert into public.cleaning_submissions (task_id, photo_path)
     values ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000002/b1.jpg')$q$);

-- ---------- student 2 (other class) -----------------------------------------
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000022');
select pg_temp.expect_count('other student cannot see student 1 submissions',
  'select 1 from public.cleaning_submissions', 0);
select pg_temp.expect_count('other student cannot see student 1 photos',
  $q$select 1 from storage.objects where bucket_id = 'cleaning-photos'$q$, 0);
select pg_temp.expect_count('other student cannot see student 1 profile',
  $q$select 1 from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000021'$q$, 0);

-- ---------- teacher 2 (not student 1's teacher) -----------------------------
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000012');
select pg_temp.expect_count('unrelated teacher cannot see student 1 submissions',
  'select 1 from public.submission_details', 0);
select pg_temp.expect_count('unrelated teacher cannot see student 1 photos',
  $q$select 1 from storage.objects where bucket_id = 'cleaning-photos'$q$, 0);
-- Teacher 2 can't even see the ids, so hand them over to prove the insert itself is blocked.
select pg_temp.act_as_owner();
create temp table t_ids as select id, task_id from public.cleaning_submissions;
grant select on t_ids to authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000012');
select pg_temp.expect_error('unrelated teacher cannot review by known id',
  $q$insert into public.submission_reviews (submission_id, decision)
     select id, 'approved' from t_ids where task_id = 'dddddddd-0000-0000-0000-000000000001'$q$);

-- ---------- teacher 1 (student 1's teacher) ---------------------------------
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000011');
select pg_temp.expect_count('teacher sees submissions of own class', 'select 1 from public.submission_details', 2);
select pg_temp.expect_count('teacher sees photos of own class submissions',
  $q$select 1 from storage.objects where bucket_id = 'cleaning-photos'$q$, 2);
select pg_temp.expect_count('teacher sees only own students', $q$select 1 from public.profiles where role = 'student'$q$, 1);
select pg_temp.expect_error('teacher cannot set status directly',
  $q$update public.cleaning_submissions set status = 'approved'$q$);
select pg_temp.expect_error('teacher cannot change roles',
  $q$select public.admin_set_user_role('aaaaaaaa-0000-0000-0000-000000000021', 'teacher')$q$);
select pg_temp.expect_ok('teacher rejects one-shot submission with comment',
  $q$insert into public.submission_reviews (submission_id, decision, comment)
     select id, 'rejected', 'Floor not swept' from public.cleaning_submissions
     where task_id = 'dddddddd-0000-0000-0000-000000000001'$q$);
select pg_temp.expect_ok('teacher rejects retryable attempt 1',
  $q$insert into public.submission_reviews (submission_id, decision)
     select id, 'rejected' from public.cleaning_submissions
     where task_id = 'dddddddd-0000-0000-0000-000000000002'$q$);
select pg_temp.expect_count('review recorded the teacher as reviewer',
  $q$select 1 from public.submission_reviews where reviewer_id = auth.uid()$q$, 2);
select pg_temp.expect_error('review history is append-only',
  $q$update public.submission_reviews set comment = 'edited'$q$);

-- ---------- student 1 again: resubmission rules ------------------------------
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000021');
select pg_temp.expect_count('student sees status rejected + teacher feedback',
  $q$select 1 from public.submission_details where status = 'rejected' and latest_comment = 'Floor not swept'$q$, 1);
select pg_temp.expect_ok('student uploads a new photo for the one-shot task',
  $q$insert into storage.objects (bucket_id, name, owner_id)
     values ('cleaning-photos', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/c.jpg', auth.uid()::text)$q$);
select pg_temp.expect_error('no resubmission when the task forbids it',
  $q$insert into public.cleaning_submissions (task_id, photo_path)
     values ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000001/c.jpg')$q$);
select pg_temp.expect_ok('resubmission allowed after rejection when the task permits it',
  $q$insert into public.cleaning_submissions (task_id, photo_path)
     values ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000021/dddddddd-0000-0000-0000-000000000002/b2.jpg')$q$);
select pg_temp.expect_count('history shows both attempts',
  $q$select 1 from public.cleaning_submissions where task_id = 'dddddddd-0000-0000-0000-000000000002'$q$, 2);

-- ---------- teacher 1: only the latest attempt can be reviewed ----------------
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000011');
select pg_temp.expect_error('older attempt cannot be re-reviewed',
  $q$insert into public.submission_reviews (submission_id, decision)
     select id, 'approved' from public.cleaning_submissions
     where photo_path like '%/b1.jpg'$q$);
select pg_temp.expect_ok('latest attempt can be approved',
  $q$insert into public.submission_reviews (submission_id, decision)
     select id, 'approved' from public.cleaning_submissions
     where photo_path like '%/b2.jpg'$q$);

-- ---------- admin ------------------------------------------------------------
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001');
select pg_temp.expect_count('admin sees all test submissions',
  $q$select 1 from public.submission_details where class_name like 'RLS Test%'$q$, 3);
select pg_temp.expect_count('admin stats include the test class that has submissions',
  $q$select 1 from public.submission_stats() where class_name like 'RLS Test%'$q$, 1);
select pg_temp.expect_ok('admin can create classes',
  $q$insert into public.classes (name) values ('RLS Test Class 3')$q$);
select pg_temp.expect_error('admin cannot change a role with a plain UPDATE',
  $q$update public.profiles set role = 'teacher' where id = 'aaaaaaaa-0000-0000-0000-000000000022'$q$);
select pg_temp.expect_ok('admin changes a role through the RPC',
  $q$select public.admin_set_user_role('aaaaaaaa-0000-0000-0000-000000000022', 'teacher')$q$);
select pg_temp.expect_count('role change removed old student enrolment',
  $q$select 1 from public.class_students where student_id = 'aaaaaaaa-0000-0000-0000-000000000022'$q$, 0);
select pg_temp.expect_error('admin cannot assign a student as a class teacher',
  $q$insert into public.class_teachers values ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000021')$q$);
select pg_temp.expect_error('admin cannot assign a task to a student outside the class',
  $q$insert into public.cleaning_tasks (class_id, assigned_student_id, title, scheduled_for, due_at)
     values ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000021', 'x', current_date, now() + interval '1 day')$q$);
select pg_temp.expect_error('admin cannot override a review timestamp or status directly',
  $q$update public.cleaning_submissions set status = 'pending'$q$);

do $$
begin
  -- Only demote the test admin if it is the only admin in this database.
  if (select count(*) from public.profiles where role = 'admin') = 1 then
    perform pg_temp.expect_error('last administrator cannot be demoted',
      $q$select public.admin_set_user_role('aaaaaaaa-0000-0000-0000-000000000001', 'student')$q$);
  else
    raise notice 'SKIP  last-admin check (other admins exist)';
  end if;
end $$;

select pg_temp.act_as_owner();
do $$ begin raise notice 'ALL CHECKS PASSED — rolling back test data'; end $$;
rollback;
