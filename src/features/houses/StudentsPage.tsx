import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import type { House, StudentOverview } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { listHouses, listStudents } from '../../services/houses';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/Layout';
import { Alert, EmptyState } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { StudentTable } from './StudentTable';
import styles from './Houses.module.scss';

const NO_HOUSE = 'none';

export function StudentsPage() {
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [houseFilter, setHouseFilter] = useState('');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [s, h] = await Promise.all([listStudents(), listHouses()]);
      setStudents(s);
      setHouses(h);
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter(
      (s) =>
        (!houseFilter || (houseFilter === NO_HOUSE ? s.house_id === null : s.house_id === houseFilter)) &&
        (!q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
    );
  }, [students, query, houseFilter]);

  if (loading) return <PageLoader label="Loading students…" />;

  return (
    <>
      <PageHeader title="Students" subtitle="Every student and their house. Click a student to see their photos." />

      {loadError ? (
        <Alert tone="error">
          {loadError}{' '}
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </Alert>
      ) : (
        <div className="stack">
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} aria-hidden="true" />
              <input
                className="input"
                type="search"
                placeholder="Search name or email"
                aria-label="Search students"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className={`select ${styles.filter}`}
              aria-label="Filter by house"
              value={houseFilter}
              onChange={(e) => setHouseFilter(e.target.value)}
            >
              <option value="">All houses</option>
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
              <option value={NO_HOUSE}>No house</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={<Users size={22} />} title={students.length === 0 ? 'No students yet' : 'No students match'}>
              {students.length === 0 ? 'Student accounts are created by an administrator.' : 'Try a different search or house.'}
            </EmptyState>
          ) : (
            <StudentTable students={visible} showHouse />
          )}
        </div>
      )}
    </>
  );
}
