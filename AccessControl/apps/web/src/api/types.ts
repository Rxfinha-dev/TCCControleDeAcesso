export type SchoolYear = 'FIRST' | 'SECOND' | 'THIRD';
export type AccessMethod = 'FINGERPRINT' | 'MANUAL';

export interface School {
  id: number;
  name: string;
  email: string;
}

/** Perfis de acesso. STUDENT, EMPLOYEE e TEACHER ainda não acessam o painel. */
export type UserRole = 'SUPER_ADMIN' | 'SCHOOL' | 'STUDENT' | 'EMPLOYEE' | 'TEACHER';

/** Escola resumida (id e nome). */
export interface SchoolRef {
  id: number;
  name: string;
}

/** Usuário logado (GET /auth/me). */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  school: SchoolRef | null;
}

/** Escola na gestão do super admin (GET /schools). */
export interface SchoolSummary {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  counts: { students: number; courses: number; accessLogs: number };
  hasLogin: boolean;
}

export interface SchoolInput {
  name: string;
  email: string;
}

/** Usuário na gestão do super admin (GET /users). */
export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  school: SchoolRef | null;
  createdAt: string;
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
  /** Opcional: escolas de ensino regular organizam os alunos só por turma. */
  year: SchoolYear | null;
  course: Pick<Course, 'id' | 'name'> | null;
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
  /** Escola da entrada (exibida no modo "todas as escolas"). */
  school?: SchoolRef;
  /** Curso do aluno: só vem no resumo do Início (cartão do dia); null se o aluno foi excluído. */
  student?: { course: { name: string } | null } | null;
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

/* Módulo acadêmico: disciplinas, professores, turmas e grade. */

export interface Subject {
  id: number;
  name: string;
  abbreviation: string;
  /** "#rrggbb" */
  color: string;
}

export type SubjectInput = Omit<Subject, 'id'>;

/** Professor é só cadastro (ainda sem login). */
export interface Teacher {
  id: number;
  name: string;
  contactEmail: string | null;
  assignmentsCount: number;
}

export interface TeacherInput {
  name: string;
  contactEmail: string;
}

export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL_TIME';

export interface ClassGroup {
  id: number;
  name: string;
  schoolYear: number;
  shift: Shift;
  course: Pick<Course, 'id' | 'name'> | null;
  studentsCount: number;
}

export interface ClassGroupInput {
  name: string;
  schoolYear: number;
  shift: Shift;
  courseId: number | null;
}

export interface TeachingAssignment {
  subject: Subject;
  teacher: Pick<Teacher, 'id' | 'name'>;
}

export interface ClassGroupDetail extends ClassGroup {
  assignments: TeachingAssignment[];
}

export interface ClassGroupStudent {
  id: number;
  name: string;
  rm: string;
  /** 'YYYY-MM-DD' */
  enrolledSince: string;
}

export type TimetableSlotKind = 'LESSON' | 'BREAK';

/** Bloco enviado ao salvar a grade (weekday 1 = segunda … 6 = sábado; minutos desde 00:00). */
export interface TimetableBlockInput {
  kind: TimetableSlotKind;
  subjectId?: number | null;
  weekday: number;
  startMinute: number;
  endMinute: number;
}

export interface TimetableBlock {
  id: number;
  kind: TimetableSlotKind;
  weekday: number;
  startMinute: number;
  endMinute: number;
  subject: Subject | null;
  teacher: Pick<Teacher, 'id' | 'name'> | null;
}

/** Mesmo professor em outra turma no mesmo horário: aviso, não bloqueia. */
export interface TeacherConflict {
  weekday: number;
  startMinute: number;
  endMinute: number;
  teacherName: string;
  classGroupName: string;
}

export interface Timetable {
  validFrom: string | null;
  blocks: TimetableBlock[];
  warnings: TeacherConflict[];
}

/* Calendário escolar: feriados, dias sem aula e bimestres. Datas em 'YYYY-MM-DD'. */

export interface Holiday {
  date: string;
  name: string;
  /** false quando a escola desmarcou o feriado (vira dia letivo). */
  active: boolean;
}

export interface NoClassDay {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

export interface NoClassDayInput {
  name: string;
  startDate: string;
  endDate?: string;
}

export interface SchoolTerm {
  /** 1 a 4 */
  number: number;
  startDate: string;
  endDate: string;
}

export interface SchoolCalendar {
  year: number;
  /** false quando a busca dos feriados nacionais falhou. */
  holidaysLoaded: boolean;
  holidays: Holiday[];
  noClassDays: NoClassDay[];
  terms: SchoolTerm[];
}
