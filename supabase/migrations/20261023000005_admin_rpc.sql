-- =============================================================================
-- 005 · Trusted administrative processes exposed as RPCs
-- =============================================================================

-- Change a user's role. The ONLY client-reachable path that can modify a role.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.app_role)
returns public.profiles
language plpgsql security definer
set search_path = ''
as $$
declare
  v_old  public.app_role;
  v_row  public.profiles;
begin
  if not private.is_admin() then
    raise exception 'only administrators can change roles' using errcode = '42501';
  end if;

  select role into v_old from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  if v_old = p_role then
    select * into v_row from public.profiles where id = p_user_id;
    return v_row;
  end if;

  -- Never leave the school without an administrator.
  if v_old = 'admin' and (
    select count(*) from public.profiles where role = 'admin'
  ) <= 1 then
    raise exception 'cannot remove the last administrator' using errcode = '23514';
  end if;

  -- Memberships only make sense for the matching role.
  if v_old = 'teacher' then
    delete from public.class_teachers where teacher_id = p_user_id;
  elsif v_old = 'student' then
    delete from public.class_students where student_id = p_user_id;
  end if;

  perform set_config('app.trusted_role_change', 'on', true);
  update public.profiles set role = p_role where id = p_user_id returning * into v_row;
  perform set_config('app.trusted_role_change', 'off', true);

  return v_row;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated;

-- Per-class submission statistics for a date range. SECURITY INVOKER, so the
-- caller's RLS scope applies: admins see every class, teachers only theirs.
create or replace function public.submission_stats(p_from date default null, p_to date default null)
returns table (
  class_id    uuid,
  class_name  text,
  total       bigint,
  pending     bigint,
  approved    bigint,
  rejected    bigint,
  late        bigint
)
language sql stable security invoker
set search_path = ''
as $$
  select
    d.class_id,
    d.class_name,
    count(*)                                        as total,
    count(*) filter (where d.status = 'pending')    as pending,
    count(*) filter (where d.status = 'approved')   as approved,
    count(*) filter (where d.status = 'rejected')   as rejected,
    count(*) filter (where d.is_late)               as late
  from public.submission_details d
  where (p_from is null or d.submitted_at >= p_from::timestamptz)
    and (p_to   is null or d.submitted_at <  (p_to + 1)::timestamptz)
  group by d.class_id, d.class_name
  order by d.class_name;
$$;

revoke all on function public.submission_stats(date, date) from public, anon;
grant execute on function public.submission_stats(date, date) to authenticated;
