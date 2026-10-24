-- =============================================================================
-- 007 · Allow admins to upsert house membership
-- PostgREST upsert runs INSERT ... ON CONFLICT DO UPDATE SET student_id, house_id,
-- which needs UPDATE privilege on both columns. Writes stay admin-only via RLS.
-- (Already included in 006 for fresh installs; this is for databases that ran
-- the earlier version of 006.)
-- =============================================================================

grant update (student_id) on public.house_students to authenticated;
