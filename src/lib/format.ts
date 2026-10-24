const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const dateOnly = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export const formatDateTime = (iso: string | null | undefined) =>
  iso ? dateTime.format(new Date(iso)) : '—';

// `date` columns arrive as YYYY-MM-DD; parse as local date, not UTC midnight.
export const formatDate = (isoDate: string | null | undefined) => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return dateOnly.format(new Date(y, m - 1, d));
};

export const roleLabel = {
  student: 'Student',
  supervisor: 'Supervisor',
  teacher: 'Teacher',
  admin: 'Administrator',
} as const;
