import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { House } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { formatDate } from '../../lib/format';
import { deletePhotosPermanently, listPhotosInRange } from '../../services/photos';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useToast } from '../../components/ui/ToastProvider';

interface Props {
  /** Open for this house; closed when null. */
  house: House | null;
  studentIds: string[];
  onClose: () => void;
  onDeleted: () => void;
}

type Found = Awaited<ReturnType<typeof listPhotosInRange>>;

/** YYYY-MM-DD of a local date, as an <input type="date"> expects. */
const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Start of that local day; with `nextDay`, the start of the day after (an exclusive end). */
const parseInputDate = (value: string, nextDay = false) => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d + (nextDay ? 1 : 0));
};

/** Admin only: permanently delete every member's photos uploaded between two dates. */
export function DeleteOldPhotosModal({ house, studentIds, onClose, onDeleted }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const houseId = house?.id;

  // Default range: everything up to one month ago.
  useEffect(() => {
    if (!houseId) return;
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    setFrom('');
    setTo(toInputDate(monthAgo));
    setError(null);
  }, [houseId]);

  const rangeError = from && to && from > to ? '"From" must be on or before "To".' : null;

  // Count matching photos whenever the range changes.
  useEffect(() => {
    setFound(null);
    if (!houseId || !to || rangeError) return;
    let cancelled = false;
    setChecking(true);
    setError(null);
    listPhotosInRange(studentIds, from ? parseInputDate(from) : new Date(0), parseInputDate(to, true))
      .then((photos) => !cancelled && setFound(photos))
      .catch((err) => !cancelled && setError(friendlyError(err)))
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, [houseId, studentIds, from, to, rangeError]);

  const rangeLabel = `${from ? formatDate(from) : 'the first upload'} to ${formatDate(to)}`;

  const handleDelete = async () => {
    if (!house || !found?.length) return;
    const ok = await confirm({
      title: `Delete ${found.length} photo${found.length === 1 ? '' : 's'}?`,
      message: `All photos uploaded in ${house.name} from ${rangeLabel} will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete permanently',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await deletePhotosPermanently(found);
      toast.success('Photos deleted', `${found.length} photo${found.length === 1 ? '' : 's'} removed`);
      onDeleted();
      onClose();
    } catch (err) {
      // Some chunks may already be gone; the count refreshes when the range is checked again.
      setError(friendlyError(err));
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      open={!!house}
      title="Delete old photos"
      onClose={onClose}
      dismissible={!deleting}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            loading={deleting}
            disabled={checking || !found?.length}
            onClick={() => void handleDelete()}
          >
            {found?.length ? `Delete ${found.length} photo${found.length === 1 ? '' : 's'}` : 'Delete'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted">
          Permanently removes the photos of every member of {house?.name} uploaded in this date range, including photos
          their owners already removed. This frees space in the database and storage.
        </p>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="From" hint="Leave empty to start from the first upload.">
          <input className="input" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To" required error={rangeError}>
          <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        {to && !rangeError && (
          <Alert tone={found?.length ? 'warning' : 'info'}>
            {checking || !found
              ? 'Counting photos…'
              : found.length
                ? `${found.length} photo${found.length === 1 ? '' : 's'} uploaded from ${rangeLabel}.`
                : `No photos uploaded from ${rangeLabel}.`}
          </Alert>
        )}
      </div>
    </Modal>
  );
}
