import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarX, Pencil, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import type { House, StudentOverview } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { deleteHouse, getHouse, listStudents, removeFromHouse } from '../../services/houses';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/Layout';
import { Alert, EmptyState } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useToast } from '../../components/ui/ToastProvider';
import { AddStudentsModal } from './AddStudentsModal';
import { DeleteOldPhotosModal } from './DeleteOldPhotosModal';
import { HouseFormModal } from './HouseFormModal';
import { StudentTable } from './StudentTable';
import { useStaffBase } from './useStaffBase';
import styles from './Houses.module.scss';

/** `houseId` prop is used by the supervisor's "My house"; otherwise it comes from the URL. */
export function HouseDetailPage({ houseId: fixedHouseId }: { houseId?: string } = {}) {
  const params = useParams();
  const houseId = fixedHouseId ?? params.houseId ?? '';
  const { base, isAdmin, isSupervisor, canManageMembers } = useStaffBase();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [house, setHouse] = useState<House | null>(null);
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const studentIds = useMemo(() => students.map((s) => s.student_id), [students]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [h, s] = await Promise.all([getHouse(houseId), listStudents({ houseId })]);
      setHouse(h);
      setStudents(s);
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = async (s: StudentOverview) => {
    const ok = await confirm({
      title: `Remove ${s.full_name}?`,
      message: `They will leave ${house?.name} and won't be able to upload until they are placed in a house again. Their photos are kept.`,
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    setRemovingId(s.student_id);
    try {
      await removeFromHouse(s.student_id);
      toast.success('Student removed', s.full_name);
      await load();
    } catch (err) {
      toast.error('Could not remove student', friendlyError(err));
    } finally {
      setRemovingId(null);
    }
  };

  const handleDelete = async () => {
    if (!house) return;
    const ok = await confirm({
      title: `Delete ${house.name}?`,
      message: 'Students in this house will have no house until you add them to another one. Their photos are kept.',
      confirmLabel: 'Delete house',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await deleteHouse(house.id);
      toast.success('House deleted', house.name);
      navigate(`${base}/houses`);
    } catch (err) {
      toast.error('Could not delete house', friendlyError(err));
    }
  };

  if (loading) return <PageLoader label="Loading house…" />;

  const back = isSupervisor ? null : (
    <Link to={`${base}/houses`} className={styles.back}>
      <ArrowLeft size={14} /> All houses
    </Link>
  );

  if (!loadError && !house) {
    return (
      <>
        {back}
        <EmptyState title="House not found">It may have been deleted.</EmptyState>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={house?.name ?? 'House'}
        subtitle={`${students.length} member${students.length === 1 ? '' : 's'} · Click a member to see their photos.`}
        actions={
          canManageMembers && (
            <>
              {isAdmin && (
                <>
                  <Button variant="secondary" icon={<Pencil size={16} />} onClick={() => setRenaming(true)}>
                    Rename
                  </Button>
                  <Button variant="secondary" icon={<Trash2 size={16} />} onClick={() => void handleDelete()}>
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<CalendarX size={16} />}
                    disabled={students.length === 0}
                    onClick={() => setCleaning(true)}
                  >
                    Delete old photos
                  </Button>
                </>
              )}
              <Button icon={<UserPlus size={16} />} onClick={() => setAdding(true)}>
                Add students
              </Button>
            </>
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
      ) : students.length === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="No students in this house"
          action={
            canManageMembers && (
              <Button icon={<UserPlus size={16} />} onClick={() => setAdding(true)}>
                Add students
              </Button>
            )
          }
        >
          Add students so they can start uploading photos.
        </EmptyState>
      ) : (
        <StudentTable
          students={students}
          actions={
            canManageMembers
              ? (s) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<UserMinus size={14} />}
                    loading={removingId === s.student_id}
                    onClick={() => void handleRemove(s)}
                  >
                    Remove
                  </Button>
                )
              : undefined
          }
        />
      )}

      {canManageMembers && (
        <AddStudentsModal house={adding ? house : null} onClose={() => setAdding(false)} onSaved={() => void load()} />
      )}
      {isAdmin && (
        <HouseFormModal open={renaming} house={house} onClose={() => setRenaming(false)} onSaved={() => void load()} />
      )}
      {isAdmin && (
        <DeleteOldPhotosModal
          house={cleaning ? house : null}
          studentIds={studentIds}
          onClose={() => setCleaning(false)}
          onDeleted={() => void load()}
        />
      )}
    </>
  );
}
