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

## 4. Turn off public sign-up (required)

The app has **no registration page**. Only administrators create accounts. Removing the form is not
enough on its own, because the sign-up API is still public. Turn it off on the Supabase side:

**Authentication → Sign In / Providers → User Signups** → turn **off** *Allow new users to sign up* → Save.

Accounts created by an admin (through the Edge Function below) still work with this off.

## 5. Deploy the `admin-users` Edge Function

Creating accounts and resetting passwords needs the service-role key, so it runs server-side in
`supabase/functions/admin-users`. Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` to the function automatically, so there are **no secrets to copy**.

**Option A: Dashboard**

1. **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `admin-users`.
3. Replace the sample code with the contents of `supabase/functions/admin-users/index.ts`.
4. Click **Deploy**.
5. Open the function's **Details / Settings** and turn **off** *Verify JWT with legacy secret*
   (*Enforce JWT verification*). The function checks the caller's session and admin role itself.

**Option B: CLI**

```powershell
npx supabase login
npx supabase functions deploy admin-users --project-ref <project-ref> --no-verify-jwt
```

## 6. Create the first administrator (one time)

With sign-up disabled, the very first account is created in the dashboard:

1. **Authentication → Users → Add user → Create new user**: enter email and password, and tick **Auto Confirm User**.
2. In the SQL Editor, make it an admin (replace the email):

```sql
begin;
select set_config('app.trusted_role_change', 'on', true);
update public.profiles set role = 'admin' where email = 'admin@yourschool.org';
commit;
```

From then on, the admin signs in to the app and creates every other account on **Admin → Users**.

## 7. Test each role

1. Sign in as the admin → **Users** → **Create user**. Create one teacher and one student. Copy each temporary password.
2. Use a separate private window for each account so the sessions don't mix.

| Check | Expected |
|---|---|
| Open `/signup` | "Page not found". There is no registration |
| Sign in as admin / teacher / student | Lands on `/admin`, `/teacher` or `/student` |
| Student opens `/admin` or `/teacher` | Redirected back to `/student` |
| Admin → Users → change a role | Confirmation dialog, then role updated |
| Admin changes own role | Disabled in the UI (the database also refuses to remove the last admin) |
| Admin → Reset password | User can sign in only with the new password |
| Create user with an existing email | "A user with this email already exists" |
| Account → Change password (wrong current password) | "Current password is incorrect." |
| Signed out, open `/student` | Redirected to `/login` |

## Security model (summary)

- RLS is enabled on every table; `anon` has no access at all.
- The role is stored in `profiles.role`. Sign-up always creates `student`; signup metadata is never trusted for roles.
- Users can only update their own `full_name` (column-level grant). Roles change via `admin_set_user_role`, which requires an admin and refuses to remove the last admin.
- `cleaning_submissions.submitted_at`, `status` and `student_id` are set by a database trigger. Clients have no UPDATE privilege on submissions, and a trigger blocks changes to the timestamp.
- Status changes only by inserting a row into `submission_reviews` (append-only history).
- Duplicate submissions are blocked by a trigger plus a partial unique index. Resubmission is only possible after a rejection and only when the task allows it.
- Photos are stored in a private bucket (5 MB, JPEG/PNG/WebP) at `{student_id}/{task_id}/…`. Students can read only their own folder. Teachers can read only photos submitted for their classes. Submitted photos cannot be deleted or overwritten.
