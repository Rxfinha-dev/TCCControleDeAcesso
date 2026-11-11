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
  /** Login de professor/aluno ("joao.silva@etec-jau"). */
  username: string | null;
  /** Senha inicial ainda não trocada. */
  mustChangePassword: boolean;
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
  username: string | null;
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
  username: string | null;
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

/* Presença por aula (calculada pela catraca; só correções e aulas canceladas são gravadas). */

export type DayInfo =
  | { kind: 'SCHOOL_DAY' | 'WEEKEND' | 'OUT_OF_TERM' }
  | { kind: 'HOLIDAY' | 'NO_CLASS'; name: string };

export type CancellationReason = 'TEACHER_ABSENT' | 'CANCELLED';
export type AttendanceSource = 'AUTO' | 'MANUAL' | 'COLLECTIVE';
export type AttendanceStatus = 'OK' | 'NEAR' | 'BELOW';

export interface AttendanceLesson {
  startMinute: number;
  endMinute: number;
  subject: Subject;
  teacher: Pick<Teacher, 'id' | 'name'> | null;
  cancellation: CancellationReason | null;
  finished: boolean;
}

export interface AttendanceMark {
  startMinute: number;
  /** null = aula ainda não terminada. */
  present: boolean | null;
  source: AttendanceSource;
}

export interface AttendanceDay {
  date: string;
  day: DayInfo;
  lessons: AttendanceLesson[];
  students: { id: number; name: string; rm: string; marks: AttendanceMark[] }[];
}

export interface AttendanceTally {
  given: number;
  present: number;
  /** null quando ainda não houve aula. */
  percent: number | null;
  status: AttendanceStatus;
}

export interface AttendanceSummary {
  from: string;
  to: string;
  minAttendance: number;
  subjects: Subject[];
  students: (AttendanceTally & { id: number; name: string; rm: string; subjects: (AttendanceTally & { subjectId: number })[] })[];
}

interface LessonKey {
  classGroupId: number;
  date: string;
  startMinute: number;
}

export interface SchoolSettings {
  minAttendance: number;
  /** Sufixo dos logins ("etec-jau"). */
  code: string | null;
  grading: Grading;
}

export type AttendanceOverrideInput = LessonKey & { studentId: number; present: boolean | null };
export type LessonCancellationInput = LessonKey & { reason: CancellationReason | null };

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ClassGroupLogins {
  created: (LoginCredentials & { studentId: number; name: string; rm: string })[];
  failed: { studentId: number; name: string; rm: string; reason: string }[];
}

/** Aulas do professor logado num dia. */
export interface TeacherLessons {
  date: string;
  day: DayInfo;
  classGroups: { id: number; name: string }[];
  lessons: (Omit<AttendanceLesson, 'teacher'> & { classGroup: { id: number; name: string } })[];
}

/* Avaliações, notas e médias. */

export type AssessmentKind = 'EXAM' | 'ASSIGNMENT';

/** Sistema de notas da escola. Em CONCEPT, `concepts` vem do maior para o menor. */
export interface Grading {
  kind: 'NUMERIC' | 'CONCEPT';
  max: number;
  decimals: number;
  /** Menor nota (ou valor de conceito) que aprova. */
  passing: number;
  concepts: { label: string; value: number }[];
}

export type GradingInput =
  | { kind: 'NUMERIC'; max: number; decimals: number; passing: number }
  | { kind: 'CONCEPT'; passing: number; concepts: { label: string; value: number }[] };

export interface AssessmentInput {
  classGroupId: number;
  subjectId: number;
  kind: AssessmentKind;
  /** 'YYYY-MM-DD' */
  date: string;
  /** Aula da prova (minutos desde 00:00); trabalho não tem. */
  startMinute: number | null;
  title: string;
  content: string | null;
  note: string | null;
  weight: number;
}

export interface Assessment extends Omit<AssessmentInput, 'subjectId'> {
  id: number;
  subject: Subject;
  gradesCount?: number;
}

export interface AssessmentList {
  grading: Grading;
  /** Disciplinas em que quem está logado pode marcar avaliação. */
  subjects: Subject[];
  assessments: Assessment[];
}

export interface AssessmentGrades {
  grading: Grading;
  assessment: Assessment;
  students: { id: number; name: string; rm: string; value: number | null }[];
}

/** Nota ou média pronta para exibir (`label: null` = sem nota). */
export interface GradeCell {
  value: number | null;
  label: string | null;
  passed: boolean | null;
}

export interface SubjectAverages {
  subjectId: number;
  terms: GradeCell[];
  semesters: GradeCell[];
  annual: GradeCell;
}

export interface GradesReport {
  grading: Grading;
  subjects: Subject[];
  students: { id: number; name: string; rm: string; subjects: SubjectAverages[] }[];
}
