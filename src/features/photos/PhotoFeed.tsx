import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';
import type { DailyPhoto } from '../../lib/database.types';
import { formatDateTime } from '../../lib/format';
import { Modal } from '../../components/ui/Modal';
import { Photo } from './Photo';
import styles from './Photos.module.scss';

/** Photos uploaded together (same batch_id) shown as one post. */
export interface PhotoPost {
  key: string;
  photos: DailyPhoto[];
  description: string;
  created_at: string;
  deleted_at: string | null;
}

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

/** Photos (newest first) -> posts grouped by the local day they were uploaded. */
function groupByDay(photos: DailyPhoto[]) {
  const posts = new Map<string, PhotoPost>();
  photos.forEach((p) => {
    const key = p.batch_id ?? p.id;
    const post = posts.get(key);
    if (post) post.photos.push(p);
    else {
      posts.set(key, { key, photos: [p], description: p.description, created_at: p.created_at, deleted_at: p.deleted_at });
    }
  });

  const days: { key: string; date: Date; posts: PhotoPost[]; photoCount: number }[] = [];
  posts.forEach((post) => {
    // Keep the upload order inside a post (rows arrive newest first).
    post.photos.sort((a, b) => a.created_at.localeCompare(b.created_at));
    const date = new Date(post.created_at);
    const key = dayKey(date);
    const last = days[days.length - 1];
    if (last?.key === key) {
      last.posts.push(post);
      last.photoCount += post.photos.length;
    } else days.push({ key, date, posts: [post], photoCount: post.photos.length });
  });
  return days;
}

export function PhotoFeed({
  photos,
  renderActions,
}: {
  photos: DailyPhoto[];
  /** Buttons under each post (owner: delete; admin: restore / delete permanently). */
  renderActions?: (post: PhotoPost) => ReactNode;
}) {
  const [open, setOpen] = useState<{ post: PhotoPost; index: number } | null>(null);
  const days = useMemo(() => groupByDay(photos), [photos]);

  const step = (delta: number) =>
    setOpen((o) => (o ? { ...o, index: (o.index + delta + o.post.photos.length) % o.post.photos.length } : o));

  // Arrow keys move between photos of the open post.
  useEffect(() => {
    if (!open || open.post.photos.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const current = open ? open.post.photos[open.index] : null;

  return (
    <>
      {days.map((day) => (
        <section key={day.key} className={styles.day}>
          <h2 className={styles.dayHeading}>
            {headingFor(day.date)}
            <span>
              {day.photoCount} photo{day.photoCount === 1 ? '' : 's'}
            </span>
          </h2>
          <div className={styles.grid}>
            {day.posts.map((post) => {
              const extra = post.photos.length - 1;
              return (
                <article key={post.key} className={`${styles.photoCard} ${post.deleted_at ? styles.removed : ''}`}>
                  <button
                    type="button"
                    className={styles.photoButton}
                    onClick={() => setOpen({ post, index: 0 })}
                    aria-label={`View ${post.photos.length > 1 ? `${post.photos.length} photos` : 'photo'} full size`}
                  >
                    <Photo path={post.photos[0].photo_path} alt={post.description} />
                    {extra > 0 && <span className={styles.countBadge}>+{extra}</span>}
                  </button>

                  {extra > 0 && (
                    <div className={styles.thumbStrip}>
                      {post.photos.slice(1, 4).map((p, i) => (
                        <button
                          key={p.id}
                          type="button"
                          className={styles.thumbButton}
                          onClick={() => setOpen({ post, index: i + 1 })}
                          aria-label={`View photo ${i + 2}`}
                        >
                          <Photo path={p.photo_path} alt="" />
                          {i === 2 && post.photos.length > 4 && (
                            <span className={styles.thumbMore}>+{post.photos.length - 4}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={styles.photoBody}>
                    {post.deleted_at && (
                      <span className={styles.removedTag}>
                        <EyeOff size={12} aria-hidden="true" /> Removed by owner · {formatDateTime(post.deleted_at)}
                      </span>
                    )}
                    <p className={styles.description}>{post.description}</p>
                    <time className={styles.photoMeta} dateTime={post.created_at}>
                      {formatDateTime(post.created_at)}
                    </time>
                    {renderActions && <div className={styles.photoActions}>{renderActions(post)}</div>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <Modal
        open={open !== null}
        wide
        title={
          open
            ? `${formatDateTime(open.post.created_at)}${
                open.post.photos.length > 1 ? ` · ${open.index + 1} / ${open.post.photos.length}` : ''
              }`
            : ''
        }
        onClose={() => setOpen(null)}
      >
        {open && current && (
          <div className="stack">
            <div className={styles.viewer}>
              <Photo path={current.photo_path} alt={open.post.description} variant="full" />
              {open.post.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.viewerNav} ${styles.viewerPrev}`}
                    onClick={() => step(-1)}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewerNav} ${styles.viewerNext}`}
                    onClick={() => step(1)}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>
            <p className={styles.viewerText}>{open.post.description}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
