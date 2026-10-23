# CleanSchool — Setup

## 1. Environment

Copy `.env.example` to `.env` and set:

```env
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon or publishable key>"
```

Only the anon/publishable key goes here. The service-role key must never be used in this app.

```bash
npm install
npm run dev      # http://localhost:3000
```

## 2. Database

In the Supabase dashboard, open **SQL Editor** and run each file in `supabase/migrations/`
**in filename order**, one at a time:

1. `20261023000001_schema.sql`: tables, constraints, indexes
2. `20261023000002_security_helpers_and_triggers.sql`: role helpers, tamper-proof triggers
3. `20261023000003_rls_policies.sql`: RLS policies, grants, `submission_details` view
4. `20261023000004_storage.sql`: private `cleaning-photos` bucket and its policies
5. `20261023000005_admin_rpc.sql`: `admin_set_user_role`, `submission_stats`

(With the Supabase CLI instead: `npx supabase link --project-ref <ref>` then `npx supabase db push`.)

## 3. Verify the security rules

Run `supabase/tests/rls_checks.sql` in the SQL Editor. It creates temporary users and data,
checks every role rule, and **rolls everything back**. You should see a list of `PASS …`
notices ending in `ALL CHECKS PASSED`. A `FAIL …` error names the rule that broke.

## 4. Auth settings

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000` (your production URL once deployed)
- Redirect URLs: add `http://localhost:3000/login` and `http://localhost:3000/reset-password`

**Authentication → Sign In / Providers → Email**: keep *Confirm email* on.

Anyone who signs up becomes a **student** with no class, so they see nothing until an admin
enrols them. To stop open sign-ups, disable *Allow new users to sign up* and invite users from
**Authentication → Users → Invite** instead.

## 5. Create the first administrator

Role changes are only possible through the admin-only RPC or a trusted operator. To bootstrap the first admin:

1. Sign up in the app with the account that should become the admin.
2. In the SQL Editor, run (replace the email):

```sql
begin;
select set_config('app.trusted_role_change', 'on', true);
update public.profiles set role = 'admin' where email = 'admin@yourschool.org';
commit;
```

From then on, that admin manages roles in the app (**Users** page, stage 5). Until that page exists,
promote test teachers the same way, using `role = 'teacher'`.

## 6. Test accounts

Create three separate accounts (e.g. `admin@…`, `teacher@…`, `student@…`) and test each one in its own
browser profile or private window so the sessions don't mix.

| Check | Expected |
|---|---|
| Sign in as each account | Lands on `/admin`, `/teacher` or `/student` respectively |
| Student opens `/admin` or `/teacher` | Redirected back to `/student` |
| Account page: change name | Saved; toast shown |
| Signed out, open `/student` | Redirected to `/login` |

## Security model (summary)

- RLS is enabled on every table; `anon` has no access at all.
- The role is stored in `profiles.role`. Sign-up always creates `student`; signup metadata is never trusted for roles.
- Users can only update their own `full_name` (column-level grant). Roles change via `admin_set_user_role`, which requires an admin and refuses to remove the last admin.
- `cleaning_submissions.submitted_at`, `status` and `student_id` are set by a database trigger. Clients have no UPDATE privilege on submissions, and a trigger blocks changes to the timestamp.
- Status changes only by inserting a row into `submission_reviews` (append-only history).
- Duplicate submissions are blocked by a trigger plus a partial unique index. Resubmission is only possible after a rejection and only when the task allows it.
- Photos are stored in a private bucket (5 MB, JPEG/PNG/WebP) at `{student_id}/{task_id}/…`. Students can read only their own folder. Teachers can read only photos submitted for their classes. Submitted photos cannot be deleted or overwritten.
