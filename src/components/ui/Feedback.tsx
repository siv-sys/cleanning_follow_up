import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { SubmissionStatus } from '../../lib/database.types';
import styles from './Feedback.module.scss';

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <p className={styles.emptyTitle}>{title}</p>
      {children && <p className={styles.emptyText}>{children}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  );
}

type AlertTone = 'error' | 'info' | 'warning' | 'success';
const alertIcon: Record<AlertTone, ReactNode> = {
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertTriangle size={18} />,
  success: <CheckCircle2 size={18} />,
};
const alertClass: Record<AlertTone, string> = {
  error: styles.alertError,
  info: styles.alertInfo,
  warning: styles.alertWarning,
  success: styles.alertSuccess,
};

export function Alert({ tone = 'info', children }: { tone?: AlertTone; children: ReactNode }) {
  return (
    <div className={`${styles.alert} ${alertClass[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      {alertIcon[tone]}
      <div>{children}</div>
    </div>
  );
}

const statusText: Record<SubmissionStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};
const statusClass: Record<SubmissionStatus, string> = {
  pending: styles.badgePending,
  approved: styles.badgeApproved,
  rejected: styles.badgeRejected,
};

export function StatusBadge({ status }: { status: SubmissionStatus | 'not_submitted' }) {
  if (status === 'not_submitted') {
    return <span className={`${styles.badge} ${styles.badgeNeutral}`}>Not submitted</span>;
  }
  return <span className={`${styles.badge} ${statusClass[status]}`}>{statusText[status]}</span>;
}
