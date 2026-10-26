-- =============================================================================
-- 013 · Overview photo count covers the last 5 days only
--   * photo_count = visible photos uploaded in the last 5 days (rolling window).
--   * last_photo_at stays all-time, so the latest upload is still shown.
-- =============================================================================

create or replace view public.student_overview
with (security_invoker = true)
as
select
  p.id          as student_id,
  p.full_name,
  p.email,
  hs.house_id,
  h.name        as house_name,
  coalesce(ph.photo_count, 0)::int as photo_count,
  ph.last_photo_at,
  p.role
from public.profiles p
left join public.house_students hs on hs.student_id = p.id
left join public.houses h          on h.id = hs.house_id
left join lateral (
  select
    count(*) filter (where d.created_at >= now() - interval '5 days') as photo_count,
    max(d.created_at) as last_photo_at
  from public.daily_photos d
  where d.student_id = p.id and d.deleted_at is null
) ph on true
where p.role in ('student', 'supervisor');
