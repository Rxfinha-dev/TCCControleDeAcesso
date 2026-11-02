export type SchoolYear = 'FIRST' | 'SECOND' | 'THIRD';
export type AccessMethod = 'FINGERPRINT' | 'MANUAL';

export interface School {
  id: number;
  name: string;
  email: string;
}

export interface Session {
  token: string;
  school: School;
}

export interface Course {
  id: number;
  name: string;
  studentsCount?: number;
}

export interface Student {
  id: number;
  name: string;
  rm: string;
  age: number;
  year: SchoolYear;
  course: Pick<Course, 'id' | 'name'>;
  hasPhoto: boolean;
  fingerprintId: number | null;
  fingerprintEnrolled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInput {
  name: string;
  rm: string;
  age: string;
  year: SchoolYear | '';
  courseId: string;
  photo?: File | null;
}

export interface AccessLog {
  id: number;
  studentId: number | null;
  studentName: string;
  method: AccessMethod;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AccessLogFilters {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface Stats {
  students: number;
  courses: number;
  entriesToday: number;
  pendingFingerprints: number;
  recentEntries: AccessLog[];
}

export interface EntryResult {
  log: AccessLog;
  student: Student;
}
