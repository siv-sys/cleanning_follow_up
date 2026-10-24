import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Camera, ImagePlus, Images, Upload, X } from 'lucide-react';
import { friendlyError } from '../../lib/errors';
import { preparePhoto, uploadPhoto } from '../../services/photos';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Layout';
import { Alert } from '../../components/ui/Feedback';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/ToastProvider';
import styles from './Photos.module.scss';

export function UploadCard({ studentId, onUploaded }: { studentId: string; onUploaded: () => void }) {
  const toast = useToast();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Resize / re-encode in the browser before showing the preview.
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setFileError(null);
    setPreparing(true);
    try {
      setFile(await preparePhoto(f));
    } catch (err) {
      setFile(null);
      setFileError((err as Error).message);
    } finally {
      setPreparing(false);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    void pick(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void pick(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const noFile = !file ? 'Take or choose a photo.' : null;
    const noDesc = !description.trim() ? 'Describe what you did.' : null;
    setFileError(noFile);
    setDescError(noDesc);
    if (noFile || noDesc || !file) return;

    setSaving(true);
    try {
      await uploadPhoto(studentId, file, description);
      toast.success('Photo uploaded', 'Your teacher can now see it.');
      setFile(null);
      setDescription('');
      onUploaded();
    } catch (err) {
      setFormError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || preparing;

  return (
    <form className={styles.uploadCard} onSubmit={handleSubmit} noValidate>
      <div className={styles.uploadSide}>
        {/* capture="environment" opens the back camera directly on phones. */}
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
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={onInputChange}
        />

        {preparing ? (
          <div className={styles.dropzone} aria-live="polite">
            <Spinner size={28} label="" />
            <span>Preparing photo…</span>
          </div>
        ) : preview ? (
          <div className={styles.preview}>
            <img src={preview} alt="Selected photo preview" />
            <button
              type="button"
              className={styles.removePreview}
              onClick={() => setFile(null)}
              disabled={saving}
              aria-label="Remove photo"
            >
              <X size={16} />
            </button>
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
              <strong>Choose a photo</strong>
              <br />
              or drag it here
            </span>
            <span>Large photos are resized automatically</span>
          </div>
        )}

        <div className={`${styles.sourceButtons} ${preview ? '' : styles.mobileOnly}`}>
          <Button
            variant={preview ? 'secondary' : 'primary'}
            icon={<Camera size={18} />}
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            block
          >
            {preview ? 'Retake' : 'Take photo'}
          </Button>
          <Button
            variant="secondary"
            icon={<Images size={18} />}
            onClick={() => galleryRef.current?.click()}
            disabled={busy}
            block
          >
            Gallery
          </Button>
        </div>

        {fileError && <Alert tone="error">{fileError}</Alert>}
      </div>

      <div className="stack">
        <h2 className={styles.uploadTitle}>Upload today's photo</h2>
        {formError && <Alert tone="error">{formError}</Alert>}
        <Field label="Description" required error={descError} hint="What did you clean today? Up to 1000 characters.">
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
          <Button type="submit" loading={saving} disabled={preparing} icon={<Upload size={16} />}>
            Upload
          </Button>
        </div>
      </div>
    </form>
  );
}
