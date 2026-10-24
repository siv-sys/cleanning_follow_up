// Edge Function: admin-users
// Trusted server-side process for account management. The service-role key is
// read from the function's environment (provided by Supabase) and never leaves
// the server. Every request must come from a signed-in administrator.
//
// Actions (POST JSON):
//   { action: 'create', email, full_name, role, password, house_id? }
//   { action: 'reset_password', user_id, password }

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ROLES = ['student', 'supervisor', 'teacher', 'admin'] as const;
type Role = (typeof ROLES)[number];
const HOUSE_MEMBER_ROLES: Role[] = ['student', 'supervisor'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function validPassword(p: unknown): p is string {
  return typeof p === 'string' && p.length >= 8 && p.length <= 72;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json(500, { error: 'Function is not configured' });
 
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json(401, { error: 'Not signed in' });

  // Client acting AS the caller: RLS and the admin RPC see the caller's identity.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await asCaller.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'Not signed in' });
  const callerId = userData.user.id;

  // Role comes from the database, never from the token's user metadata.
  const { data: caller, error: callerError } = await asCaller
    .from('profiles')
    .select('role')
    .eq('id', callerId)
    .maybeSingle();
  if (callerError || caller?.role !== 'admin') {
    return json(403, { error: 'Only administrators can manage accounts' });
  }

  // Privileged client: used only for the auth admin API.
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (body.action === 'create') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const role = body.role as Role;
    const houseId = body.house_id ? String(body.house_id) : null;

    if (!EMAIL_RE.test(email)) return json(400, { error: 'Enter a valid email address' });
    if (!fullName || fullName.length > 120) return json(400, { error: 'Full name must be 1–120 characters' });
    if (!ROLES.includes(role)) return json(400, { error: 'Invalid role' });
    if (!validPassword(body.password)) return json(400, { error: 'Password must be 8–72 characters' });
    if (houseId && !UUID_RE.test(houseId)) return json(400, { error: 'Invalid house' });
    if (houseId && !HOUSE_MEMBER_ROLES.includes(role)) {
      return json(400, { error: 'Only students and supervisors are placed in houses' });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true, // the admin vouches for the address; no confirmation email needed
      user_metadata: { full_name: fullName },
    });
    if (createError || !created.user) {
      const msg = /already.*registered|already exists/i.test(createError?.message ?? '')
        ? 'A user with this email already exists'
        : createError?.message ?? 'Could not create user';
      return json(400, { error: msg });
    }
    const newId = created.user.id;

    // The DB trigger created the profile as 'student'. Further steps run as the
    // calling admin so the normal RPC / RLS rules apply. Undo on any failure.
    try {
      if (role !== 'student') {
        const { error } = await asCaller.rpc('admin_set_user_role', { p_user_id: newId, p_role: role });
        if (error) throw error;
      }
      if (houseId) {
        const { error } = await asCaller.from('house_students').insert({ house_id: houseId, student_id: newId });
        if (error) throw error;
      }
    } catch (e) {
      await admin.auth.admin.deleteUser(newId);
      return json(400, { error: `User not created: ${(e as Error).message}` });
    }

    const { data: profile } = await asCaller.from('profiles').select('*').eq('id', newId).single();
    return json(200, { user: profile });
  }

  if (body.action === 'reset_password') {
    const userId = String(body.user_id ?? '');
    if (!UUID_RE.test(userId)) return json(400, { error: 'Invalid user' });
    if (!validPassword(body.password)) return json(400, { error: 'Password must be 8–72 characters' });

    const { error } = await admin.auth.admin.updateUserById(userId, { password: body.password });
    if (error) return json(400, { error: error.message });
    return json(200, { ok: true });
  }

  return json(400, { error: 'Unknown action' });
});
