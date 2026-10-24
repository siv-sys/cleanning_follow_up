-- =============================================================================
-- 009 · New role: supervisor
-- Must run (and commit) on its own: Postgres does not allow a new enum value
-- to be used in the same transaction that adds it. 010 uses it.
-- =============================================================================

alter type public.app_role add value if not exists 'supervisor' after 'student';
