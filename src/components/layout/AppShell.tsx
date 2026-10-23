import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useConfirm } from '../ui/ConfirmProvider';
import { roleLabel } from '../../lib/format';
import { accountNav, navByRole } from './navigation';
import styles from './AppShell.module.scss';

export function AppShell() {
  const { profile, signOut } = useAuth();
  const confirm = useConfirm();
  if (!profile) return null;

  const items = navByRole[profile.role];

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      message: 'You will need to sign in again to continue.',
      confirmLabel: 'Sign out',
    });
    if (ok) await signOut();
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.active : ''}`;

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className={styles.sidebar} aria-label="Main navigation">
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <Sparkles size={18} />
          </span>
          CleanSchool
        </div>

        <nav className={styles.nav}>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <NavLink to={accountNav.to} className={linkClass}>
            <accountNav.icon size={18} aria-hidden="true" />
            <span className={styles.user}>
              <span className={styles.userName}>{profile.full_name}</span>
              <span className={styles.userRole}>{roleLabel[profile.role]}</span>
            </span>
          </NavLink>
          <button type="button" className={styles.navLink} onClick={handleSignOut}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <Sparkles size={16} />
          </span>
          CleanSchool
        </div>
        <div className={styles.topbarActions}>
          <NavLink to={accountNav.to} className={styles.iconButton} aria-label="Account">
            <accountNav.icon size={20} />
          </NavLink>
          <button type="button" className={styles.iconButton} onClick={handleSignOut} aria-label="Sign out">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main id="main" className={styles.main} tabIndex={-1}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <nav className={styles.bottomNav} aria-label="Main navigation">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
