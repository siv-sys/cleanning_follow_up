import type { LucideIcon } from 'lucide-react';
import { Home, Images, UserCircle, UserCog, Users } from 'lucide-react';
import type { AppRole } from '../../lib/database.types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path (for index routes). */
  end?: boolean;
}

export const navByRole: Record<AppRole, NavItem[]> = {
  student: [{ to: '/student', label: 'My photos', icon: Images, end: true }],
  supervisor: [
    { to: '/supervisor', label: 'My photos', icon: Images, end: true },
    { to: '/supervisor/house', label: 'My house', icon: Home },
  ],
  teacher: [
    { to: '/teacher/houses', label: 'Houses', icon: Home },
    { to: '/teacher/students', label: 'Students', icon: Users },
  ],
  admin: [
    { to: '/admin/houses', label: 'Houses', icon: Home },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/users', label: 'Users', icon: UserCog },
  ],
};

export const accountNav: NavItem = { to: '/account', label: 'Account', icon: UserCircle };
