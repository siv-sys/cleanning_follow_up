import { useCallback, useEffect, useState } from 'react';
import { Images, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import type { DailyPhoto, House } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { getMyHouse } from '../../services/houses';
import { hidePhoto, listPhotos } from '../../services/photos';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/Layout';
import { Alert, EmptyState } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useToast } from '../../components/ui/ToastProvider';
import { PhotoFeed } from './PhotoFeed';
import { UploadCard } from './UploadCard';

export function MyPhotosPage() {
  const { profile } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();
  const [house, setHouse] = useState<House | null>(null);
  const [photos, setPhotos] = useState<DailyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoadError(null);
    try {
      const [h, p] = await Promise.all([getMyHouse(profile.id), listPhotos(profile.id)]);
      setHouse(h);
      setPhotos(p);
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (photo: DailyPhoto) => {
    const ok = await confirm({
      title: 'Delete this photo?',
      message: 'It will disappear for you and your teachers. Only a school administrator can still see it.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setDeletingId(photo.id);
    try {
      // Hidden, not removed: admins keep the record.
      await hidePhoto(photo);
      setPhotos((list) => list.filter((p) => p.id !== photo.id));
      toast.success('Photo deleted');
    } catch (err) {
      toast.error('Could not delete photo', friendlyError(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <PageLoader label="Loading your photos…" />;

  return (
    <>
      <PageHeader
        title="My photos"
        subtitle={house ? `${house.name} · Upload a photo of your work each day.` : 'Upload a photo of your work each day.'}
      />

      {loadError ? (
        <Alert tone="error">
          {loadError}{' '}
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </Alert>
      ) : (
        <div className="stack" style={{ gap: '2rem' }}>
          {house && profile ? (
            <UploadCard studentId={profile.id} onUploaded={() => void load()} />
          ) : (
            <Alert tone="warning">
              You have not been placed in a house yet, so you can't upload photos. Ask your school administrator.
            </Alert>
          )}

          {photos.length === 0 ? (
            <EmptyState icon={<Images size={22} />} title="No photos yet">
              Photos you upload will appear here, grouped by day.
            </EmptyState>
          ) : (
            <PhotoFeed
              photos={photos}
              renderActions={(p) => (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 size={14} />}
                  loading={deletingId === p.id}
                  onClick={() => void handleDelete(p)}
                >
                  Delete
                </Button>
              )}
            />
          )}
        </div>
      )}
    </>
  );
}
