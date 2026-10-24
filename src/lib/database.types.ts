// Hand-written to match supabase/migrations. Regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type AppRole = 'student' | 'supervisor' | 'teacher' | 'admin';
/** Roles that belong to a house and upload photos. */
export const HOUSE_MEMBER_ROLES = ['student', 'supervisor'] as const;
export const isHouseMemberRole = (role: AppRole) => (HOUSE_MEMBER_ROLES as readonly AppRole[]).includes(role);
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type ReviewDecision = 'approved' | 'rejected';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export type ClassRow = {
  id: string;
  name: string;
  grade: string | null;
  room: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ClassTeacher = {
  class_id: string;
  teacher_id: string;
  created_at: string;
}

export type ClassStudent = {
  class_id: string;
  student_id: string;
  created_at: string;
}

export type CleaningTask = {
  id: string;
  class_id: string;
  assigned_student_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  scheduled_for: string;
  due_at: string;
  allow_resubmission: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CleaningSubmission = {
  id: string;
  task_id: string;
  student_id: string;
  photo_path: string;
  student_note: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
}

export type SubmissionReview = {
  id: string;
  submission_id: string;
  reviewer_id: string | null;
  decision: ReviewDecision;
  comment: string | null;
  created_at: string;
}

export type SubmissionDetail = {
  id: string;
  task_id: string;
  student_id: string;
  photo_path: string;
  student_note: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  is_late: boolean;
  task_title: string;
  task_location: string | null;
  task_due_at: string;
  task_scheduled_for: string;
  class_id: string;
  class_name: string;
  student_name: string | null;
  student_email: string | null;
  latest_comment: string | null;
  latest_reviewer_id: string | null;
  latest_reviewer_name: string | null;
}

export type SubmissionStatsRow = {
  class_id: string;
  class_name: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  late: number;
}

export type House = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type HouseStudent = {
  student_id: string;
  house_id: string;
  created_at: string;
}

export type DailyPhoto = {
  id: string;
  student_id: string;
  photo_path: string;
  description: string;
  created_at: string;
  /** Set when the owner removed it; such photos are visible to admins only. */
  deleted_at: string | null;
  deleted_by: string | null;
}

export type StudentOverview = {
  student_id: string;
  full_name: string;
  email: string;
  house_id: string | null;
  house_name: string | null;
  photo_count: number;
  last_photo_at: string | null;
  role: AppRole;
}

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, never, { full_name?: string }>;
      classes: Table<ClassRow, { name: string; grade?: string | null; room?: string | null }>;
      class_teachers: Table<ClassTeacher, { class_id: string; teacher_id: string }>;
      class_students: Table<ClassStudent, { class_id: string; student_id: string }>;
      cleaning_tasks: Table<
        CleaningTask,
        {
          class_id: string;
          assigned_student_id?: string | null;
          title: string;
          description?: string | null;
          location?: string | null;
          scheduled_for: string;
          due_at: string;
          allow_resubmission?: boolean;
        }
      >;
      // Only these columns are granted to clients; the rest are server-owned.
      cleaning_submissions: Table<
        CleaningSubmission,
        { task_id: string; photo_path: string; student_note?: string | null },
        never
      >;
      submission_reviews: Table<
        SubmissionReview,
        { submission_id: string; decision: ReviewDecision; comment?: string | null },
        never
      >;
      houses: Table<House, { name: string }>;
      house_students: Table<HouseStudent, { student_id: string; house_id: string }, { house_id?: string }>;
      // Server sets student_id and created_at; photos cannot be edited.
      daily_photos: Table<DailyPhoto, { photo_path: string; description: string }, never>;
    };
    Views: {
      submission_details: { Row: SubmissionDetail; Relationships: [] };
      student_overview: { Row: StudentOverview; Relationships: [] };
    };
    Functions: {
      admin_set_user_role: {
        Args: { p_user_id: string; p_role: AppRole };
        Returns: Profile;
      };
      hide_daily_photo: { Args: { p_photo_id: string }; Returns: undefined };
      restore_daily_photo: { Args: { p_photo_id: string }; Returns: undefined };
      submission_stats: {
        Args: { p_from?: string | null; p_to?: string | null };
        Returns: SubmissionStatsRow[];
      };
    };
    Enums: {
      app_role: AppRole;
      submission_status: SubmissionStatus;
      review_decision: ReviewDecision;
    };
    CompositeTypes: Record<string, never>;
  };
}
