import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, Search, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { isHouseMemberRole, type AppRole, type House, type Profile } from '../../lib/database.types';
import { friendlyError } from '../../lib/errors';
import { formatDate, roleLabel } from '../../lib/format';
import { listHouses } from '../../services/houses';
import { listUsers, setUserRole, type UserWithHouse } from '../../services/users';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/Layout';
import { Alert, EmptyState } from '../../components/ui/Feedback';
import { PageLoader } from '../../components/ui/Spinner';
import { useConfirm } from '../../components/ui/ConfirmProvider';
import { useToast } from '../../components/ui/ToastProvider';
import { CreateUserModal } from './CreateUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import styles from './UsersPage.module.scss';

type RoleFilter = 'all' | AppRole;

export function UsersPage() {
  const { profile: me } = useAuth();
  const confirm = useConfirm();
  const toast = useToast();

  const [users, setUsers] = useState<UserWithHouse[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<Profile | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [u, h] = await Promise.all([listUsers(), listHouses()]);
      setUsers(u);
      setHouses(h);
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c = { all: users.length, student: 0, supervisor: 0, teacher: 0, admin: 0 };
    users.forEach((u) => c[u.role]++);
    return c;
  }, [users]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === 'all' || u.role === roleFilter) &&
        (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, query, roleFilter]);

  const handleRoleChange = async (user: UserWithHouse, role: AppRole) => {
    if (role === user.role) return;
    // Switching between student and supervisor keeps the house.
    const losesHouse = user.houseName !== null && !isHouseMemberRole(role);
    const ok = await confirm({
      title: `Change role to ${roleLabel[role]}?`,
      message: (
        <>
          <strong>{user.full_name}</strong> will become a {roleLabel[role].toLowerCase()}.
          {losesHouse && ` They will be removed from ${user.houseName}.`}
        </>
      ),
      confirmLabel: 'Change role',
      tone: losesHouse ? 'danger' : 'primary',
    });
    if (!ok) return;

    setChangingId(user.id);
    try {
      await setUserRole(user.id, role);
      toast.success('Role updated', `${user.full_name} is now a ${roleLabel[role].toLowerCase()}.`);
      await load();
    } catch (err) {
      toast.error('Could not change role', friendlyError(err));
    } finally {
      setChangingId(null);
    }
  };

  if (loading) return <PageLoader label="Loading users…" />;

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Create accounts for students and teachers. There is no public sign-up."
        actions={
          <Button icon={<UserPlus size={16} />} onClick={() => setCreating(true)}>
            Create user
          </Button>
        }
      />

      {loadError ? (
        <Alert tone="error">
          {loadError}{' '}
          <Button size="sm" variant="secondary" onClick={() => void load()}>
            Retry
          </Button>
        </Alert>
      ) : (
        <div className="stack">
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} aria-hidden="true" />
              <input
                className="input"
                type="search"
                placeholder="Search name or email"
                aria-label="Search users"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className={styles.tabs} role="tablist" aria-label="Filter by role">
              {(['all', 'student', 'supervisor', 'teacher', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={roleFilter === r}
                  className={`${styles.tab} ${roleFilter === r ? styles.tabActive : ''}`}
                  onClick={() => setRoleFilter(r)}
                >
                  {r === 'all' ? 'All' : `${roleLabel[r]}s`}
                  <span className={styles.count}>{counts[r]}</span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<Users size={22} />}
              title={users.length <= 1 ? 'No other users yet' : 'No users match'}
              action={
                users.length <= 1 && (
                  <Button icon={<UserPlus size={16} />} onClick={() => setCreating(true)}>
                    Create the first user
                  </Button>
                )
              }
            >
              {users.length <= 1
                ? 'Create accounts for teachers and students. They sign in with the email and password you set.'
                : 'Try a different search or role filter.'}
            </EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>House</th>
                    <th>Created</th>
                    <th>
                      <span className="visually-hidden">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((u) => {
                    const isMe = u.id === me?.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className={styles.name}>
                            {u.full_name}
                            {isMe && <span className={styles.you}>You</span>}
                          </div>
                          <div className={styles.email}>{u.email}</div>
                        </td>
                        <td>
                          <select
                            className={`select ${styles.roleSelect}`}
                            value={u.role}
                            aria-label={`Role for ${u.full_name}`}
                            disabled={isMe || changingId === u.id}
                            title={isMe ? "You can't change your own role" : undefined}
                            onChange={(e) => void handleRoleChange(u, e.target.value as AppRole)}
                          >
                            <option value="student">Student</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td className={styles.classes}>
                          {u.houseName ?? <span className="muted">—</span>}
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                        <td className={styles.actions}>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<KeyRound size={14} />}
                            onClick={() => setResetting(u)}
                          >
                            Reset password
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CreateUserModal open={creating} houses={houses} onClose={() => setCreating(false)} onCreated={() => void load()} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
    </>
  );
}
