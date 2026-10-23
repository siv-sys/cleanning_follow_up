export type UserRole = 'admin' | 'teacher' | 'student' | 'auth';

export interface AuditItem {
  id: string;
  studentName: string;
  initials: string;
  room: string;
  assignedTeacher: string;
  zone: string;
  status: 'Approved' | 'Verifying' | 'Redo Needed' | 'Issued';
  timestamp: string;
  notes?: string;
  photoUrl?: string;
  checklistItems?: { id: string; text: string; done: boolean }[];
  sanitizerUsed?: string;
}

export interface SanitationSpot {
  id: string;
  room: string;
  wing: string;
  detail: string;
  time: string;
  photoUrl: string;
  altText: string;
  sanitizer: string;
  inspector: string;
  hygieneScore: number;
}

export interface StudentTask {
  id: string;
  title: string;
  room: string;
  hall: string;
  zone: string;
  deadline: string;
  allowResubmission: boolean;
  status: 'Issued' | 'In Progress' | 'Verifying' | 'Approved' | 'Redo Needed';
  checklist: { id: string; text: string; done: boolean }[];
  photoProofUrl: string | null;
  teacherNote?: string;
  submittedAt?: string;
  studentName: string;
  assignedTeacher: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: 'success' | 'alert' | 'info' | 'warning';
  read: boolean;
}
