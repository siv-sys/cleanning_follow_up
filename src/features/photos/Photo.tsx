import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { photoUrl } from '../../services/photos';
import { Spinner } from '../../components/ui/Spinner';
import styles from './Photos.module.scss';

/** Renders a photo from the private bucket via a short-lived signed URL. */
export function Photo({ path, alt, variant = 'cover' }: { path: string; alt: string; variant?: 'cover' | 'full' }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    photoUrl(path)
      .then((u) => active && setUrl(u))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <div className={`${styles.photo} ${styles[variant]}`}>
      {url && !failed ? (
        <img src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className={styles.placeholder}>
          {failed ? <ImageOff size={22} aria-label="Photo unavailable" /> : <Spinner size={20} label="" />}
        </div>
      )}
    </div>
  );
}
