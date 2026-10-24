import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { StudentOverview } from '../../lib/database.types';
import { formatDateTime } from '../../lib/format';
import { useStaffBase } from './useStaffBase';
import styles from './Houses.module.scss';

/** Students list; clicking a row opens that student's photos. */
export function StudentTable({
  students,
  showHouse,
  actions,
}: {
  students: StudentOverview[];
  showHouse?: boolean;
  actions?: (s: StudentOverview) => ReactNode;
}) {
  const navigate = useNavigate();
  const { base } = useStaffBase();

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Member</th>
            {showHouse && <th className={styles.desktopCell}>House</th>}
            <th className={styles.desktopCell}>Photos</th>
            <th className={styles.desktopCell}>Last upload</th>
            {actions && (
              <th>
                <span className="visually-hidden">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const to = `${base}/students/${s.student_id}`;
            return (
              <tr key={s.student_id} className={styles.rowLink} onClick={() => navigate(to)}>
                <td>
                  <Link to={to} className={styles.name} onClick={(e) => e.stopPropagation()}>
                    {s.full_name}
                  </Link>
                  {s.role === 'supervisor' && <span className={styles.roleTag}>Supervisor</span>}
                  <div className={styles.email}>{s.email}</div>
                  {/* Phones: the hidden columns, condensed under the name. */}
                  <div className={styles.mobileMeta}>
                    {showHouse && `${s.house_name ?? 'No house'} · `}
                    {s.photo_count} photo{s.photo_count === 1 ? '' : 's'}
                    {s.last_photo_at && ` · last ${formatDateTime(s.last_photo_at)}`}
                  </div>
                </td>
                {showHouse && (
                  <td className={styles.desktopCell}>{s.house_name ?? <span className="muted">No house</span>}</td>
                )}
                <td className={styles.desktopCell}>{s.photo_count}</td>
                <td className={styles.desktopCell}>
                  {s.last_photo_at ? formatDateTime(s.last_photo_at) : <span className="muted">—</span>}
                </td>
                {actions && (
                  <td className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    {actions(s)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
