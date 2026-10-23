-- =============================================================================
-- 001 · Core schema: enums, tables, constraints, indexes, timestamps
-- =============================================================================

create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.review_decision as enum ('approved', 'rejected');

-- -----------------------------------------------------------------------------
-- Generic updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user. Role is NEVER taken from client input.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null check (char_length(btrim(full_name)) between 1 and 120),
  role        public.app_role not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_full_name_idx on public.profiles (lower(full_name));

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- classes and their membership
-- -----------------------------------------------------------------------------
create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(btrim(name)) between 1 and 80),
  grade       text check (grade is null or char_length(grade) <= 20),
  room        text check (room is null or char_length(room) <= 40),
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

create table public.class_teachers (
  class_id    uuid not null references public.classes (id) on delete cascade,
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (class_id, teacher_id)
);

create index class_teachers_teacher_idx on public.class_teachers (teacher_id);

create table public.class_students (
  class_id    uuid not null references public.classes (id) on delete cascade,
  student_id  uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index class_students_student_idx on public.class_students (student_id);

-- -----------------------------------------------------------------------------
-- cleaning_tasks: always belong to a class (so teacher scope is well defined).
-- assigned_student_id = null  -> every student in the class
-- assigned_student_id = <id>  -> only that student (must be in the class)
-- -----------------------------------------------------------------------------
create table public.cleaning_tasks (
  id                   uuid primary key default gen_random_uuid(),
  class_id             uuid not null references public.classes (id) on delete cascade,
  assigned_student_id  uuid references public.profiles (id) on delete cascade,
  title                text not null check (char_length(btrim(title)) between 1 and 120),
  description          text check (description is null or char_length(description) <= 2000),
  location             text check (location is null or char_length(location) <= 120),
  scheduled_for        date not null,
  due_at               timestamptz not null,
  allow_resubmission   boolean not null default false,
  created_by           uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index cleaning_tasks_class_idx on public.cleaning_tasks (class_id);
create index cleaning_tasks_student_idx on public.cleaning_tasks (assigned_student_id)
  where assigned_student_id is not null;
create index cleaning_tasks_due_idx on public.cleaning_tasks (due_at);

create trigger cleaning_tasks_set_updated_at
  before update on public.cleaning_tasks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- cleaning_submissions
-- submitted_at / status / student_id are server-controlled (see 002 triggers).
-- -----------------------------------------------------------------------------
create table public.cleaning_submissions (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.cleaning_tasks (id) on delete cascade,
  student_id    uuid not null references public.profiles (id) on delete cascade,
  photo_path    text not null unique check (char_length(photo_path) <= 300),
  student_note  text check (student_note is null or char_length(student_note) <= 1000),
  status        public.submission_status not null default 'pending',
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz
);

create index cleaning_submissions_task_idx on public.cleaning_submissions (task_id);
create index cleaning_submissions_student_idx on public.cleaning_submissions (student_id, submitted_at desc);
create index cleaning_submissions_status_idx on public.cleaning_submissions (status);
create index cleaning_submissions_submitted_idx on public.cleaning_submissions (submitted_at desc);

-- At most one "live" (pending or approved) submission per student per task.
-- Backs up the trigger check in 002 against concurrent inserts.
create unique index cleaning_submissions_one_live_idx
  on public.cleaning_submissions (task_id, student_id)
  where status in ('pending', 'approved');

-- -----------------------------------------------------------------------------
-- submission_reviews: append-only review history
-- -----------------------------------------------------------------------------
create table public.submission_reviews (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.cleaning_submissions (id) on delete cascade,
  reviewer_id    uuid references public.profiles (id) on delete set null,
  decision       public.review_decision not null,
  comment        text check (comment is null or char_length(comment) <= 1000),
  created_at     timestamptz not null default now()
);

create index submission_reviews_submission_idx on public.submission_reviews (submission_id, created_at desc);
create index submission_reviews_reviewer_idx on public.submission_reviews (reviewer_id, created_at desc);
