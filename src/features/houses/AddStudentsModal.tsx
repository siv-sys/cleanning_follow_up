import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { House, StudentOverview } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { assignStudents, listStudents } from '../../services/houses';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Feedback';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import styles from './Houses.module.scss';

interface Props {
  house: House | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AddStudentsModal({ house, onClose, onSaved }: Props) {
  const toast = useToast();
  const [students, setStudents] = useState<StudentOverview[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!house) return;
    setStudents(null);
    setSelected(new Set());
    setQuery('');
    setError(null);
    listStudents()
      // Only students who are not in any house yet.
      .then((all) => setStudents(all.filter((s) => s.house_id === null)))
      .catch((err) => setError(friendlyError(err)));
  }, [house]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (students ?? []).filter(
      (s) => !q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [students, query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = async () => {
    if (!house || selected.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      await assignStudents(house.id, [...selected]);
      toast.success('Students added', `${selected.size} student${selected.size === 1 ? '' : 's'} moved to ${house.name}.`);
      onSaved();
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={house !== null}
      title={`Add students · ${house?.name ?? ''}`}
      onClose={onClose}
      dismissible={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} loading={saving} disabled={selected.size === 0}>
            Add {selected.size || ''} to house
          </Button>
        </>
      }
    >
      <div className="stack">
        {error && <Alert tone="error">{error}</Alert>}
        <p className="muted">
          Only students who are not in a house yet are listed. To move a student, remove them from their current house
          first.
        </p>
        <div className={styles.search} style={{ maxWidth: 'none' }}>
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
        {students === null && !error ? (
          <div className="row" style={{ justifyContent: 'center', padding: 24 }}>
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <p className="muted">
            {query.trim() ? 'No students match.' : 'Every student is already in a house.'}
          </p>
        ) : (
          <div className={styles.pickList}>
            {visible.map((s) => (
              <label key={s.student_id} className={styles.pickItem}>
                <input type="checkbox" checked={selected.has(s.student_id)} onChange={() => toggle(s.student_id)} />
                <span>
                  <span className={styles.name}>{s.full_name}</span>
                  {s.role === 'supervisor' && <span className={styles.roleTag}>Supervisor</span>}
                  <br />
                  <span className={styles.email}>{s.email}</span>
                </span>              </label>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
