import { supabase } from '../lib/supabase';
import type { House, StudentOverview } from '../lib/database.types';

export interface HouseWithCount extends House {
  studentCount: number;
}

export async function listHouses(): Promise<HouseWithCount[]> {
  const [houses, members] = await Promise.all([
    supabase.from('houses').select('*').order('name'),
    supabase.from('house_students').select('house_id'),
  ]);
  const error = houses.error ?? members.error;
  if (error) throw error;

  const counts = new Map<string, number>();
  members.data?.forEach((m) => counts.set(m.house_id, (counts.get(m.house_id) ?? 0) + 1));
  return (houses.data ?? []).map((h) => ({ ...h, studentCount: counts.get(h.id) ?? 0 }));
}

export async function getHouse(id: string): Promise<House | null> {
  const { data, error } = await supabase.from('houses').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/** The current student's house, or null if they have not been placed yet. */
export async function getMyHouse(studentId: string): Promise<House | null> {
  const { data, error } = await supabase
    .from('house_students')
    .select('house_id')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data ? getHouse(data.house_id) : null;
}

export async function listStudents(filter: { houseId?: string } = {}): Promise<StudentOverview[]> {
  let q = supabase.from('student_overview').select('*').order('full_name');
  if (filter.houseId) q = q.eq('house_id', filter.houseId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getStudent(studentId: string): Promise<StudentOverview | null> {
  const { data, error } = await supabase
    .from('student_overview')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---- Admin -------------------------------------------------------------------

export async function createHouse(name: string) {
  const { error } = await supabase.from('houses').insert({ name: name.trim() });
  if (error) throw error;
}

export async function renameHouse(id: string, name: string) {
  const { error } = await supabase.from('houses').update({ name: name.trim() }).eq('id', id);
  if (error) throw error;
}

export async function deleteHouse(id: string) {
  const { error } = await supabase.from('houses').delete().eq('id', id);
  if (error) throw error;
}

/** Puts students in a house, moving them out of any other house. */
export async function assignStudents(houseId: string, studentIds: string[]) {
  if (studentIds.length === 0) return;
  const { error } = await supabase
    .from('house_students')
    .upsert(studentIds.map((student_id) => ({ student_id, house_id: houseId })), { onConflict: 'student_id' });
  if (error) throw error;
}

export async function removeFromHouse(studentId: string) {
  const { error } = await supabase.from('house_students').delete().eq('student_id', studentId);
  if (error) throw error;
}
