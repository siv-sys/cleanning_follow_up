import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import styles from './AuthLayout.module.scss';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const brand = (
    <span className={styles.brand}>
      <span className={styles.logo} aria-hidden="true">
        <Sparkles size={18} />
      </span>
      CleanSchool
    </span>
  );

  return (
    <div className={styles.page}>
      <aside className={styles.aside}>
        {brand}
        <div className={styles.pitch}>
          <h2>Cleaner classrooms, verified.</h2>
          <p>
            Students submit photo proof of their cleaning tasks, teachers review them, and
            administrators see the whole school at a glance.
          </p>
        </div>
        <small>Submission times are recorded by the server, not the device.</small>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.panel}>
          <div className={styles.mobileBrand}>{brand}</div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export { styles as authStyles };
