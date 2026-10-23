import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  History,
  ListChecks,
  School,
  UserCircle,
  Users,
} from 'lucide-react';
import type { AppRole } from '../../lib/database.types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path (for index routes). */
  end?: boolean;
}

export const navByRole: Record<AppRole, NavItem[]> = {
  student: [
    { to: '/student', label: 'My tasks', icon: ClipboardList, end: true },
    { to: '/student/history', label: 'History', icon: History },
  ],
  teacher: [
    { to: '/teacher', label: 'Submissions', icon: ClipboardCheck, end: true },
    { to: '/teacher/students', label: 'Students', icon: Users },
    { to: '/teacher/reviews', label: 'My reviews', icon: History },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
    { to: '/admin/submissions', label: 'Submissions', icon: ClipboardCheck },
    { to: '/admin/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/admin/classes', label: 'Classes', icon: School },
    { to: '/admin/users', label: 'Users', icon: Users },
  ],
};

export const accountNav: NavItem = { to: '/account', label: 'Account', icon: UserCircle };
