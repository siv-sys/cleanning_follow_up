import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Images, RotateCcw, Trash2 } from 'lucide-react';
import type { DailyPhoto, StudentOverview } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { getStudent } from '../../services/houses';
import { deletePhotoPermanently, listPhotos, restorePhoto } from '../../services/photos';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/Layout';
import { Alert, EmptyState } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useToast } from '../../components/ui/ToastProvider';
import { PhotoFeed } from '../photos/PhotoFeed';
import { useStaffBase } from './useStaffBase';
import styles from './Houses.module.scss';

/**
 * One member's uploads. Read-only for teachers and supervisors; admins also see
 * photos the owner removed and can restore or permanently delete them.
 */
export function StudentPhotosPage() {
  const { studentId = '' } = useParams();
  const { base, houseHref, isAdmin } = useStaffBase();
  const confirm = useConfirm();
  const toast = useToast();
  const [student, setStudent] = useState<StudentOverview | null>(null);
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [s, p] = await Promise.all([getStudent(studentId), listPhotos(studentId)]);
      setStudent(s);
      setPhotos(p);
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (photo: DailyPhoto) => {
    const ok = await confirm({
      title: 'Delete this photo permanently?',
      message: 'The photo and its file are removed from the database. This cannot be undone.',
      confirmLabel: 'Delete permanently',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(photo.id);
    try {
      await deletePhotoPermanently(photo);
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
      toast.success('Photo deleted permanently');
    } catch (err) {
      toast.error('Could not delete photo', friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (photo: DailyPhoto) => {
    setBusyId(photo.id);
    try {
      await restorePhoto(photo);
      toast.success('Photo restored', 'It is visible again to the member and their teachers.');
      await load();
    } catch (err) {
      toast.error('Could not restore photo', friendlyError(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Loading photos…" />;

  const removedCount = photos.filter((p) => p.deleted_at).length;

  const back = student?.house_id ? (
    <Link to={houseHref(student.house_id)} className={styles.back}>
      <ArrowLeft size={14} /> {student.house_name}
    </Link>
  ) : (
    <Link to={`${base}/students`} className={styles.back}>
      <ArrowLeft size={14} /> All students
    </Link>
  );

  if (!loadError && !student) {
    return (
      <>
        {back}
        <EmptyState title="Student not found" />
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={student?.full_name ?? 'Student'}
        subtitle={
          student && (
            <>
              {student.role === 'supervisor' && 'Supervisor · '}
              {student.house_name ?? 'No house'} · {student.email} · {student.photo_count} photo
              {student.photo_count === 1 ? '' : 's'}
              {isAdmin && removedCount > 0 && ` · ${removedCount} removed by owner`}
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
      ) : photos.length === 0 ? (
        <EmptyState icon={<Images size={22} />} title="No photos yet">
          This student has not uploaded any photos.
        </EmptyState>
      ) : (
        <div className="stack" style={{ gap: '2rem' }}>
          <PhotoFeed
            photos={photos}
            renderActions={
              isAdmin
                ? (p) => (
                    <>
                      {p.deleted_at && (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<RotateCcw size={14} />}
                          disabled={busyId === p.id}
                          onClick={() => void handleRestore(p)}
                        >
                          Restore
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 size={14} />}
                        loading={busyId === p.id}
                        onClick={() => void handleDelete(p)}
                      >
                        Delete permanently
                      </Button>
                    </>
                  )
                : undefined
            }
          />
        </div>
      )}
    </>
  );
}
