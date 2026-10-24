import { useAuth } from '../../auth/AuthProvider';

/**
 * Teachers, admins and supervisors share the house pages under their own route
 * prefix. Supervisors only ever see their own house (enforced by RLS).
 */
export function useStaffBase() {
  const { profile } = useAuth();
  const role = profile?.role;
  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const base = isAdmin ? '/admin' : isSupervisor ? '/supervisor' : '/teacher';
  return {
    base,
    isAdmin,
    isSupervisor,
    /** Create houses and add / remove students (teachers and admins). */
    canManageMembers: isAdmin || role === 'teacher',
    houseHref: (houseId: string) => (isSupervisor ? `${base}/house` : `${base}/houses/${houseId}`),
  };
}
