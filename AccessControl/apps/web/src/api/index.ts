import { request, requestJson } from './client';
import type {
  AccessLog,
  AccessLogFilters,
  ClassGroup,
  ClassGroupDetail,
  ClassGroupInput,
  ClassGroupStudent,
  Course,
  EntryResult,
  Paginated,
  SchoolInput,
  SchoolSummary,
  Stats,
  Student,
  StudentInput,
  Subject,
  SubjectInput,
  Teacher,
  TeacherInput,
  TeachingAssignment,
  Timetable,
  TimetableBlockInput,
  UserRole,
  UserSummary,
} from './types';

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const result = search.toString();
  return result ? `?${result}` : '';
};

const studentForm = (input: StudentInput) => {
  const form = new FormData();
  form.set('name', input.name);
  form.set('rm', input.rm);
  form.set('age', input.age);
  form.set('year', input.year);
  form.set('courseId', input.courseId);
  if (input.photo) form.set('photo', input.photo);
  return form;
};

export { authApi } from './auth';

export const coursesApi = {
  list: () => requestJson<Course[]>('/courses'),
  create: (name: string) => requestJson<Course>('/courses', { method: 'POST', body: { name } }),
  update: (id: number, name: string) => requestJson<Course>(`/courses/${id}`, { method: 'PUT', body: { name } }),
  remove: (id: number) => requestJson<void>(`/courses/${id}`, { method: 'DELETE' }),
};

export const subjectsApi = {
  list: () => requestJson<Subject[]>('/subjects'),
  create: (input: SubjectInput) => requestJson<Subject>('/subjects', { method: 'POST', body: { ...input } }),
  update: (id: number, input: SubjectInput) => requestJson<Subject>(`/subjects/${id}`, { method: 'PUT', body: { ...input } }),
  remove: (id: number) => requestJson<void>(`/subjects/${id}`, { method: 'DELETE' }),
};

export const teachersApi = {
  list: () => requestJson<Teacher[]>('/teachers'),
  create: (input: TeacherInput) => requestJson<Teacher>('/teachers', { method: 'POST', body: { ...input } }),
  update: (id: number, input: TeacherInput) => requestJson<Teacher>(`/teachers/${id}`, { method: 'PUT', body: { ...input } }),
  remove: (id: number) => requestJson<void>(`/teachers/${id}`, { method: 'DELETE' }),
};

export const classGroupsApi = {
  list: (schoolYear: number) => requestJson<ClassGroup[]>(`/class-groups${query({ schoolYear })}`),
  get: (id: number) => requestJson<ClassGroupDetail>(`/class-groups/${id}`),
  create: (input: ClassGroupInput) => requestJson<ClassGroup>('/class-groups', { method: 'POST', body: { ...input } }),
  update: (id: number, input: ClassGroupInput) =>
    requestJson<ClassGroup>(`/class-groups/${id}`, { method: 'PUT', body: { ...input } }),
  remove: (id: number) => requestJson<void>(`/class-groups/${id}`, { method: 'DELETE' }),
  copy: (input: { fromYear: number; toYear: number }) =>
    requestJson<{ created: number; skipped: string[] }>('/class-groups/copy', { method: 'POST', body: { ...input } }),
  students: (id: number) => requestJson<ClassGroupStudent[]>(`/class-groups/${id}/students`),
  addStudents: (id: number, studentIds: number[]) =>
    requestJson<{ added: number; moved: number }>(`/class-groups/${id}/students`, { method: 'POST', body: { studentIds } }),
  removeStudent: (id: number, studentId: number) =>
    requestJson<void>(`/class-groups/${id}/students/${studentId}`, { method: 'DELETE' }),
  setAssignment: (id: number, subjectId: number, teacherId: number) =>
    requestJson<TeachingAssignment>(`/class-groups/${id}/assignments/${subjectId}`, { method: 'PUT', body: { teacherId } }),
  removeAssignment: (id: number, subjectId: number) =>
    requestJson<void>(`/class-groups/${id}/assignments/${subjectId}`, { method: 'DELETE' }),
  timetable: (id: number) => requestJson<Timetable>(`/class-groups/${id}/timetable`),
  saveTimetable: (id: number, blocks: TimetableBlockInput[]) =>
    requestJson<Timetable>(`/class-groups/${id}/timetable`, { method: 'PUT', body: { blocks } }),
};

export const studentsApi = {
  list: (search?: string) => requestJson<Student[]>(`/students${query({ search })}`),
  create: (input: StudentInput) => requestJson<Student>('/students', { method: 'POST', body: studentForm(input) }),
  update: (id: number, input: StudentInput) =>
    requestJson<Student>(`/students/${id}`, { method: 'PUT', body: studentForm(input) }),
  remove: (id: number) => requestJson<void>(`/students/${id}`, { method: 'DELETE' }),
  photo: async (id: number) => (await request(`/students/${id}/photo`)).blob(),
  reserveFingerprint: (id: number) =>
    requestJson<{ fingerprintId: number }>(`/students/${id}/fingerprint`, { method: 'POST' }),
  confirmFingerprint: (id: number) => requestJson<Student>(`/students/${id}/fingerprint/confirm`, { method: 'POST' }),
  clearFingerprint: (id: number) => requestJson<Student>(`/students/${id}/fingerprint`, { method: 'DELETE' }),
};

export const accessLogsApi = {
  list: (filters: AccessLogFilters) => requestJson<Paginated<AccessLog>>(`/access-logs${query({ ...filters })}`),
  exportCsv: async (filters: AccessLogFilters) =>
    (await request(`/access-logs/export${query({ ...filters, page: undefined, pageSize: undefined })}`)).blob(),
  registerFingerprint: (fingerprintId: number) =>
    requestJson<EntryResult>('/access-logs/fingerprint', { method: 'POST', body: { fingerprintId } }),
  registerManual: (rm: string) => requestJson<EntryResult>('/access-logs/manual', { method: 'POST', body: { rm } }),
};

/** Gestão de escolas (só super admin). */
export const schoolsApi = {
  list: () => requestJson<SchoolSummary[]>('/schools'),
  create: (input: SchoolInput) => requestJson<SchoolSummary>('/schools', { method: 'POST', body: { ...input } }),
  update: (id: number, input: SchoolInput) =>
    requestJson<SchoolSummary>(`/schools/${id}`, { method: 'PUT', body: { ...input } }),
  remove: (id: number) => requestJson<void>(`/schools/${id}`, { method: 'DELETE' }),
};

/** Gestão de usuários e perfis (só super admin). */
export const usersApi = {
  list: (params: { search?: string; role?: UserRole } = {}) => requestJson<UserSummary[]>(`/users${query(params)}`),
  changeRole: (id: number, role: Extract<UserRole, 'SCHOOL' | 'SUPER_ADMIN'>) =>
    requestJson<UserSummary>(`/users/${id}`, { method: 'PATCH', body: { role } }),
};

export const statsApi = {
  get: () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return requestJson<Stats>(`/stats${query({ since: startOfDay.toISOString() })}`);
  },
};
