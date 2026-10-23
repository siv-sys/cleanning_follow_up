import styles from './Feedback.module.scss';

export function Spinner({ size = 24, label = 'Loading' }: { size?: number; label?: string }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role={label ? 'status' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
    />
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className={styles.pageLoader} role="status">
      <Spinner size={32} label="" />
      <span>{label}</span>
    </div>
  );
}
