export type Language = 'ar' | 'fr';

export type UserRole = 'public' | 'parent' | 'educator' | 'director' | 'admin';

export interface Branch {
  id: string;
  slug: 'main' | 'work' | 'farm';
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  address: string;
  mapUrl: string;
  image: string;
  phone: string;
  active: boolean;
}

export interface Section {
  id: string;
  branch_id: string;
  branch_slug: 'main' | 'work' | 'farm';
  slug: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Student {
  id: string;
  membership_no: string;
  full_name: string;
  dob: string;
  phone: string;
  disability: string;
  center: 'main' | 'work' | 'farm';
  branch_id: string;
  section_id: string;
  section: string;
  academic_year: string;
  active: boolean;
  public_uuid: string;
  registration_code: string;
  guardian_name?: string;
  notes?: string;
  photo?: string;
  emergency_phone?: string;
}

export interface Educator {
  id: string;
  name: string;
  role: string;
  specialty: string;
  branch_slug: 'main' | 'work' | 'farm';
  section_id?: string;
  section_name?: string;
  phone: string;
  email: string;
  avatarLetter: string;
  active: boolean;
}

export type SkillStatus = 'acquired' | 'in_progress' | 'not_acquired' | 'not_evaluated';

export interface EvaluationItem {
  id: string;
  child_id: string;
  domain: string;
  skill: string;
  status: SkillStatus;
  date: string;
  notes?: string;
  educator_name: string;
}

export interface ProgressReport {
  id: string;
  child_id: string;
  child_name: string;
  term: string;
  academic_year: string;
  date: string;
  overallScore: number;
  generalNotes: string;
  educatorName: string;
  domainScores: {
    domain: string;
    percentage: number;
    acquiredCount: number;
    totalCount: number;
  }[];
}

export interface Appointment {
  id: string;
  child_id?: string;
  child_name?: string;
  title: string;
  type: 'consultation' | 'speech_therapy' | 'psychology' | 'meeting' | 'workshop';
  date: string;
  time: string;
  specialist: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  author_role: string;
  target: 'all' | 'main' | 'work' | 'farm' | 'section';
  section_slug?: string;
  urgent: boolean;
}

export interface DocumentRecord {
  id: string;
  child_id?: string;
  title: string;
  category: 'pedagogical' | 'medical' | 'administrative' | 'evaluation' | 'card';
  date: string;
  size: string;
  fileType: string;
  uploader: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actor_email: string;
  action: string;
  target: string;
  status: 'success' | 'warning' | 'info';
}

export interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  branch_slug?: 'main' | 'work' | 'farm';
  child_id?: string; // for parent
}
