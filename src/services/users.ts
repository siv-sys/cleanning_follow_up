import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppRole, Profile } from '../lib/database.types';

export interface UserWithHouse extends Profile {
  houseName: string | null;
}

/** All profiles with the house each student belongs to (admin view). */
export async function listUsers(): Promise<UserWithHouse[]> {
  const [profiles, houses, members] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('houses').select('id, name'),
    supabase.from('house_students').select('student_id, house_id'),
  ]);
  const error = profiles.error ?? houses.error ?? members.error;
  if (error) throw error;

  const houseName = new Map((houses.data ?? []).map((h) => [h.id, h.name]));
  const byStudent = new Map((members.data ?? []).map((m) => [m.student_id, houseName.get(m.house_id) ?? null]));

  return (profiles.data ?? []).map((p) => ({ ...p, houseName: byStudent.get(p.id) ?? null }));
}

export async function setUserRole(userId: string, role: AppRole) {
  const { error } = await supabase.rpc('admin_set_user_role', { p_user_id: userId, p_role: role });
  if (error) throw error;
}

// ---- Edge Function calls (privileged account management) -------------------

async function callAdminUsers<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    // Surface the function's own error message instead of a generic one.
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? 'Request failed');
    }
    throw new Error(
      /Failed to send a request/i.test(error.message)
        ? 'Could not reach the admin-users function. Has it been deployed?'
        : error.message
    );
  }
  return data as T;
}

export interface CreateUserInput {
  email: string;
  full_name: string;
  role: AppRole;
  password: string;
  /** Students only. */
  house_id?: string | null;
}

export function createUser(input: CreateUserInput) {
  return callAdminUsers<{ user: Profile }>({ action: 'create', ...input });
}

export function resetUserPassword(userId: string, password: string) {
  return callAdminUsers<{ ok: true }>({ action: 'reset_password', user_id: userId, password });
}
