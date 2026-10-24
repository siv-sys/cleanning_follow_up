import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import type { House } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { getMyHouse } from '../../services/houses';
import { PageHeader } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { HouseDetailPage } from './HouseDetailPage';

/** Supervisor: the members of their own house. */
export function MyHousePage() {
  const { profile } = useAuth();
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    getMyHouse(profile.id)
      .then(setHouse)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) return <PageLoader label="Loading your house…" />;
  if (house) return <HouseDetailPage houseId={house.id} />;

  return (
    <>
      <PageHeader title="My house" />
      <Alert tone={error ? 'error' : 'warning'}>
        {error ?? 'You have not been placed in a house yet. Ask your school administrator.'}
      </Alert>
    </>
  );
}
