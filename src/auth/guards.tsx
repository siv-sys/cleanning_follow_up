import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import type { AppRole } from '../lib/database.types';
import { PageLoader } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Feedback';
import { Button } from '../components/ui/Button';

export const homeFor: Record<AppRole, string> = {
  student: '/student',
  teacher: '/teacher',
  admin: '/admin',
};

/**
 * Route guard. This only decides what to *show*; it is not a security boundary.
 * Every read and write is authorised again by Supabase RLS on the server.
 */
export function RequireAuth({ roles, children }: { roles?: AppRole[]; children?: ReactNode }) {
  const { session, profile, loading, profileError, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your account…" />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!profile) {
    return (
      <div style={{ maxWidth: 520, margin: '15vh auto', padding: 16 }} className="stack">
        <Alert tone="error">{profileError ?? 'Could not load your profile.'}</Alert>
        <Button variant="secondary" onClick={signOut}>
          Sign out
        </Button>
      </div>
    );
  }

  if (roles && !roles.includes(profile.role)) {
    return <Navigate to={homeFor[profile.role]} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/** For /login etc.: signed-in users are sent to their dashboard. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (session && profile) return <Navigate to={homeFor[profile.role]} replace />;
  return <>{children}</>;
}

export function RoleHome() {
  const { profile } = useAuth();
  return <Navigate to={profile ? homeFor[profile.role] : '/login'} replace />;
}
