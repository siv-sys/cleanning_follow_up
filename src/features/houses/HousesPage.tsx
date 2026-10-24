import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Plus } from 'lucide-react';
import { friendlyError } from '../../lib/errors';
import { listHouses, type HouseWithCount } from '../../services/houses';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/Layout';
import { Alert, EmptyState } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { HouseFormModal } from './HouseFormModal';
import { useStaffBase } from './useStaffBase';
import styles from './Houses.module.scss';

export function HousesPage() {
  const { base, canManageMembers: canCreate } = useStaffBase();
  const [houses, setHouses] = useState<HouseWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setHouses(await listHouses());
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageLoader label="Loading houses…" />;

  return (
    <>
      <PageHeader
        title="Houses"
        subtitle="Open a house to see its students and their photos."
        actions={
          canCreate && (
            <Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
              Create house
            </Button>
          )
        }
      />

      {loadError ? (
        <Alert tone="error">
          {loadError}{' '}
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </Alert>
      ) : houses.length === 0 ? (
        <EmptyState
          icon={<Home size={22} />}
          title="No houses yet"
          action={
            canCreate && (
              <Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
                Create the first house
              </Button>
            )
          }
        >
          Create houses, then add students to them.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {houses.map((h) => (
            <Link key={h.id} to={`${base}/houses/${h.id}`} className={styles.houseCard}>
              <div className={styles.houseIcon}>
                <Home size={22} />
              </div>
              <div>
                <div className={styles.houseName}>{h.name}</div>
                <div className={styles.houseCount}>
                  {h.studentCount} student{h.studentCount === 1 ? '' : 's'}
                </div>
              </div>
              <ChevronRight size={18} className={styles.chevron} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}

      <HouseFormModal open={creating} onClose={() => setCreating(false)} onSaved={() => void load()} />
    </>
  );
}
