-- =============================================================================
-- 012 · Several photos per upload
-- Photos uploaded together (one description) share a batch_id so the app can
-- show them as one post. Older photos have batch_id = null (one photo each).
-- =============================================================================

alter table public.daily_photos add column batch_id uuid;

create index daily_photos_batch_idx on public.daily_photos (batch_id) where batch_id is not null;

grant insert (batch_id) on public.daily_photos to authenticated;
