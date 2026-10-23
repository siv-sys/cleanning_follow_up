import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { roleLabel } from '../../lib/format';
import { EmptyState } from '../../components/ui/Feedback';
import { PageHeader } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';

/** Temporary page for routes that are implemented in a later stage. */
export function Placeholder({ title, stage }: { title: string; stage: number }) {
  const { profile } = useAuth();
  return (
    <>
      <PageHeader
        title={title}
        subtitle={profile ? `Signed in as ${profile.full_name} · ${roleLabel[profile.role]}` : undefined}
      />
      <EmptyState icon={<Construction size={22} />} title="Coming soon">
        This screen is built in stage {stage}. Login and role-based routing are working.
      </EmptyState>
    </>
  );
}

export function NotFoundPage() {
  return (
    <div style={{ maxWidth: 520, margin: '15vh auto', padding: 16 }}>
      <EmptyState
        title="Page not found"
        action={
          <Link to="/">
            <Button variant="secondary">Go to dashboard</Button>
          </Link>
        }
      >
        The page you are looking for doesn't exist or you don't have access to it.
      </EmptyState>
    </div>
  );
}
