import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Camera, ImagePlus, Images, Plus, Upload, X } from 'lucide-react';
import { friendlyError } from '../../lib/errors';
import { MAX_PHOTOS_PER_UPLOAD, preparePhoto, uploadPhotos } from '../../services/photos';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import styles from './Photos.module.scss';

interface Picked {
  id: string;
  file: File;
  url: string;
}

export function UploadCard({ studentId, onUploaded }: { studentId: string; onUploaded: () => void }) {
  const toast = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [description, setDescription] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(0);
  const [saving, setSaving] = useState(false);

  // Free preview URLs when photos are removed or the card unmounts.
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const remaining = MAX_PHOTOS_PER_UPLOAD - picked.length - preparing;
  const isFull = remaining <= 0;

  // Resize / re-encode each photo in the browser, then add it to the list.
  const addFiles = async (list: FileList | File[] | null | undefined) => {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    setFileError(null);
    const accepted = files.slice(0, Math.max(0, remaining));
    if (files.length > accepted.length) {
      setFileError(`You can add up to ${MAX_PHOTOS_PER_UPLOAD} photos per upload.`);
    }
    if (accepted.length === 0) return;

    setPreparing((n) => n + accepted.length);
    const results = await Promise.allSettled(accepted.map((f) => preparePhoto(f)));
    setPreparing((n) => n - accepted.length);

    const ok: Picked[] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled') {
        ok.push({ id: crypto.randomUUID(), file: r.value, url: URL.createObjectURL(r.value) });
      } else {
        setFileError((r.reason as Error).message);
      }
    });
    setPicked((prev) => [...prev, ...ok].slice(0, MAX_PHOTOS_PER_UPLOAD));
  };

  const removePicked = (id: string) =>
    setPicked((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });

  const clearPicked = () => {
    picked.forEach((p) => URL.revokeObjectURL(p.url));
    setPicked([]);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const noFile = picked.length === 0 ? 'Take or choose at least one photo.' : null;
    const noDesc = !description.trim() ? 'Describe what you did.' : null;
    setFileError(noFile);
    setDescError(noDesc);
    if (noFile || noDesc) return;

    setSaving(true);
    try {
      await uploadPhotos(
        studentId,
        picked.map((p) => p.file),
        description
      );
      toast.success(
        picked.length > 1 ? `${picked.length} photos uploaded` : 'Photo uploaded',
        'Your teacher can now see them.'
      );
      clearPicked();
      setDescription('');
      onUploaded();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || preparing > 0;
  const hasPhotos = picked.length > 0 || preparing > 0;

  return (
    <form className={styles.uploadCard} onSubmit={handleSubmit} noValidate>
      <div className={styles.uploadSide}>
        {/* capture="environment" opens the back camera directly on phones (one photo per shot). */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onInputChange}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onInputChange}
        />

        {hasPhotos ? (
          <div
            className={`${styles.pickedGrid} ${dragging ? styles.dragging : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isFull) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {picked.map((p, i) => (
              <div key={p.id} className={styles.pickedItem}>
                <img src={p.url} alt={`Selected photo ${i + 1}`} />
                <button
                  type="button"
                  className={styles.removePreview}
                  onClick={() => removePicked(p.id)}
                  disabled={saving}
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {Array.from({ length: preparing }, (_, i) => (
              <div key={`prep-${i}`} className={`${styles.pickedItem} ${styles.pickedPlaceholder}`}>
                <Spinner size={20} label="" />
              </div>
            ))}
            {!isFull && (
              <button
                type="button"
                className={`${styles.pickedItem} ${styles.pickedAdd}`}
                onClick={() => galleryRef.current?.click()}
                disabled={busy}
              >
                <Plus size={20} aria-hidden="true" />
                <span>Add</span>
              </button>
            )}
          </div>
        ) : (
          // Desktop: click or drag. Hidden on phones, where the buttons below are clearer.
          <div
            role="button"
            tabIndex={0}
            className={`${styles.dropzone} ${styles.desktopOnly} ${dragging ? styles.dragging : ''}`}
            onClick={() => galleryRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                galleryRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <ImagePlus size={32} aria-hidden="true" />
            <span>
              <strong>Choose photos</strong>
              <br />
              or drag them here
            </span>
            <span>Up to {MAX_PHOTOS_PER_UPLOAD} photos · resized automatically</span>
          </div>
        )}

        <div className={`${styles.sourceButtons} ${hasPhotos ? '' : styles.mobileOnly}`}>
          <Button
            variant={hasPhotos ? 'secondary' : 'primary'}
            icon={<Camera size={18} />}
            onClick={() => cameraRef.current?.click()}
            disabled={busy || isFull}
            block
          >
            {hasPhotos ? 'Take another' : 'Take photo'}
          </Button>
          <Button
            variant="secondary"
            icon={<Images size={18} />}
            onClick={() => galleryRef.current?.click()}
            disabled={busy || isFull}
            block
          >
            Gallery
          </Button>
        </div>

        <span className={styles.pickedCount}>
          {picked.length}/{MAX_PHOTOS_PER_UPLOAD} photos
        </span>

        {fileError && <Alert tone="error">{fileError}</Alert>}
      </div>

      <div className="stack">
        <h2 className={styles.uploadTitle}>Upload today's photos</h2>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field
          label="Description"
          required
          error={descError}
          hint="What did you clean today? One description for all photos · up to 1000 characters."
        >
          <textarea
            className="textarea"
            maxLength={1000}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
        </Field>
        <div className={styles.uploadFoot}>
          <span className="muted" style={{ fontSize: '0.75rem' }}>
            {description.length}/1000
          </span>
          <Button type="submit" loading={saving} disabled={preparing > 0} icon={<Upload size={16} />}>
            {picked.length > 1 ? `Upload ${picked.length} photos` : 'Upload'}
          </Button>
        </div>
      </div>
    </form>
  );
}
