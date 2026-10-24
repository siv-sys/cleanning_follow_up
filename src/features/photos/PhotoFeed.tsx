import { useMemo, useState, type ReactNode } from 'react';
import { EyeOff } from 'lucide-react';
import type { DailyPhoto } from '../../lib/database.types';
import { formatDateTime } from '../../lib/format';
import { Modal } from '../../components/ui/Modal';
import { Photo } from './Photo';
import styles from './Photos.module.scss';

const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function headingFor(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  return dayLabel.format(date);
}

/** Photos grouped by the (local) day they were uploaded, newest first. */
export function PhotoFeed({
  photos,
  renderActions,
}: {
  photos: DailyPhoto[];
  /** Buttons under each photo (owner: delete; admin: restore / delete permanently). */
  renderActions?: (photo: DailyPhoto) => ReactNode;
}) {
  const [open, setOpen] = useState<DailyPhoto | null>(null);

  const days = useMemo(() => {
    const groups: { key: string; date: Date; items: DailyPhoto[] }[] = [];
    photos.forEach((p) => {
      const date = new Date(p.created_at);
      const key = dayKey(date);
      const last = groups[groups.length - 1];
      if (last?.key === key) last.items.push(p);
      else groups.push({ key, date, items: [p] });
    });
    return groups;
  }, [photos]);

  return (
    <>
      {days.map((day) => (
        <section key={day.key} className={styles.day}>
          <h2 className={styles.dayHeading}>
            {headingFor(day.date)}
            <span>
              {day.items.length} photo{day.items.length === 1 ? '' : 's'}
            </span>
          </h2>
          <div className={styles.grid}>
            {day.items.map((p) => (
              <article key={p.id} className={`${styles.photoCard} ${p.deleted_at ? styles.removed : ''}`}>
                <button
                  type="button"
                  className={styles.photoButton}
                  onClick={() => setOpen(p)}
                  aria-label="View photo full size"
                >
                  <Photo path={p.photo_path} alt={p.description} />
                </button>
                <div className={styles.photoBody}>
                  {p.deleted_at && (
                    <span className={styles.removedTag}>
                      <EyeOff size={12} aria-hidden="true" /> Removed by owner · {formatDateTime(p.deleted_at)}
                    </span>
                  )}
                  <p className={styles.description}>{p.description}</p>
                  <time className={styles.photoMeta} dateTime={p.created_at}>
                    {formatDateTime(p.created_at)}
                  </time>
                  {renderActions && <div className={styles.photoActions}>{renderActions(p)}</div>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <Modal open={open !== null} wide title={open ? formatDateTime(open.created_at) : ''} onClose={() => setOpen(null)}>
        {open && (
          <div className="stack">
            <Photo path={open.photo_path} alt={open.description} variant="full" />
            <p className={styles.viewerText}>{open.description}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
