import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { dateOnly } from '../src/lib/dates';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import { CalendarService } from '../src/modules/calendar/calendar.service';
import { ClassGroupsService } from '../src/modules/class-groups/class-groups.service';
import type { User } from '@prisma/client';
import { authHeader, buildTestApp, classGroup, school, schoolUser } from './helpers';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const PORT = { id: 2, name: 'Português', abbreviation: 'POR', color: '#aa3322' };
const MONDAY = '2026-03-09';

const slot = (weekday: number, startMinute: number, endMinute: number, subject: typeof MATH) => ({
  id: startMinute + weekday,
  versionId: 1,
  kind: 'LESSON',
  subjectId: subject.id,
  weekday,
  startMinute,
  endMinute,
  subject,
});
/** Grade de segunda: MAT 07:30–08:20 e POR 08:20–09:10. */
const version = (validFrom: string, slots = [slot(1, 450, 500, MATH), slot(1, 500, 550, PORT)]) => ({
  id: 1,
  classGroupId: classGroup.id,
  validFrom: dateOnly(validFrom),
  createdAt: new Date(),
  slots,
});
const enrollment = (studentId: number, name: string, startDate = '2026-02-02', endDate: string | null = null) => ({
  id: studentId,
  classGroupId: classGroup.id,
  studentId,
  schoolYear: 2026,
  startDate: dateOnly(startDate),
  endDate: endDate ? dateOnly(endDate) : null,
  createdAt: new Date(),
  student: { id: studentId, name, rm: String(24000 + studentId) },
});
/** Leitura da catraca no horário de São Paulo (UTC-3). */
const reading = (studentId: number, date: string, hhmm: string) => ({
  studentId,
  createdAt: new Date(`${date}T${hhmm}:00.000-03:00`),
});

function setup(user?: User) {
  const ctx = buildTestApp({ user });
  const { prisma } = ctx;
  prisma.classGroup.findFirst.mockResolvedValue(classGroup);
  prisma.school.findUniqueOrThrow.mockResolvedValue(school);
  // Calendário: feriados já carregados, 1º bimestre de 02/02 a 17/04.
  prisma.nationalHoliday.count.mockResolvedValue(1);
  prisma.nationalHoliday.findMany.mockResolvedValue([]);
  prisma.holidayOverride.findMany.mockResolvedValue([]);
  prisma.noClassDay.findMany.mockResolvedValue([]);
  prisma.schoolTerm.findMany.mockResolvedValue([
    { id: 1, schoolId: school.id, schoolYear: 2026, number: 1, startDate: dateOnly('2026-02-02'), endDate: dateOnly('2026-04-17') },
  ]);
  prisma.timetableVersion.findMany.mockResolvedValue([version('2026-02-02')] as never);
  prisma.enrollment.findMany.mockResolvedValue([enrollment(10, 'Ana Souza'), enrollment(11, 'Bruno Lima')] as never);
  prisma.attendanceOverride.findMany.mockResolvedValue([]);
  prisma.lessonCancellation.findMany.mockResolvedValue([]);
  prisma.accessLog.findMany.mockResolvedValue([]);
  prisma.teachingAssignment.findMany.mockResolvedValue([{ subjectId: 1, teacher: { id: 5, name: 'Ana Prado' } }] as never);
  return ctx;
}

const day = (app: ReturnType<typeof buildTestApp>['app'], date = MONDAY) =>
  request(app).get(`/api/attendance/day?classGroupId=20&date=${date}`).set('Authorization', authHeader());
const put = (app: ReturnType<typeof buildTestApp>['app'], path: string, body: object) =>
  request(app).put(`/api/attendance/${path}`).set('Authorization', authHeader()).send(body);

describe('Presença', () => {
  it('chamada do dia: presença pela catraca em cada aula', async () => {
    const { app, prisma } = setup();
    // Ana entrou 07:25 e ficou; Bruno entrou 07:25 e saiu 08:30 (10 min da 2ª aula).
    prisma.accessLog.findMany.mockResolvedValue([
      reading(10, MONDAY, '07:25'),
      reading(11, MONDAY, '07:25'),
      reading(11, MONDAY, '08:30'),
    ] as never);

    const res = await day(app);

    expect(res.status).toBe(200);
    expect(res.body.day).toEqual({ kind: 'SCHOOL_DAY' });
    expect(res.body.lessons).toEqual([
      { startMinute: 450, endMinute: 500, subject: MATH, cancellation: null, finished: true, teacher: { id: 5, name: 'Ana Prado' } },
      { startMinute: 500, endMinute: 550, subject: PORT, cancellation: null, finished: true, teacher: null },
    ]);
    expect(res.body.students).toEqual([
      {
        id: 10,
        name: 'Ana Souza',
        rm: '24010',
        marks: [
          { startMinute: 450, present: true, source: 'AUTO' },
          { startMinute: 500, present: true, source: 'AUTO' },
        ],
      },
      {
        id: 11,
        name: 'Bruno Lima',
        rm: '24011',
        marks: [
          { startMinute: 450, present: true, source: 'AUTO' },
          { startMinute: 500, present: false, source: 'AUTO' },
        ],
      },
    ]);
    // As leituras são buscadas pelo dia de São Paulo (03:00Z a 03:00Z), só dos alunos da turma.
    expect(prisma.accessLog.findMany.mock.calls[0][0]?.where).toEqual({
      schoolId: school.id,
      studentId: { in: [10, 11] },
      createdAt: { gte: new Date('2026-03-09T03:00:00.000Z'), lt: new Date('2026-03-10T03:00:00.000Z') },
    });
  });

  it('quem não entrou no dia tem falta em todas as aulas', async () => {
    const { app } = setup();

    const res = await day(app);

    expect(res.body.students[0].marks.map((mark: { present: boolean }) => mark.present)).toEqual([false, false]);
  });

  it('feriado não tem aula: ninguém leva presença nem falta', async () => {
    const { app, prisma } = setup();
    prisma.nationalHoliday.findMany.mockResolvedValue([{ date: dateOnly(MONDAY), name: 'Feriado de teste' }]);

    const res = await day(app);

    expect(res.body).toMatchObject({ day: { kind: 'HOLIDAY', name: 'Feriado de teste' }, lessons: [], students: [] });
  });

  it('feriado desmarcado pela escola volta a ter aula', async () => {
    const { app, prisma } = setup();
    prisma.nationalHoliday.findMany.mockResolvedValue([{ date: dateOnly(MONDAY), name: 'Feriado de teste' }]);
    prisma.holidayOverride.findMany.mockResolvedValue([{ schoolId: school.id, date: dateOnly(MONDAY) }]);

    const res = await day(app);

    expect(res.body.day).toEqual({ kind: 'SCHOOL_DAY' });
    expect(res.body.lessons).toHaveLength(2);
  });

  it('dia fora dos bimestres não conta presença', async () => {
    const { app, prisma } = setup();
    prisma.schoolTerm.findMany.mockResolvedValue([]);

    const res = await day(app);

    expect(res.body).toMatchObject({ day: { kind: 'OUT_OF_TERM' }, lessons: [], students: [] });
  });

  it('correção manual prevalece sobre a catraca', async () => {
    const { app, prisma } = setup();
    prisma.attendanceOverride.findMany.mockResolvedValue([
      { classGroupId: 20, studentId: 10, date: dateOnly(MONDAY), startMinute: 450, present: true },
    ] as never);

    const res = await day(app);

    expect(res.body.students[0].marks).toEqual([
      { startMinute: 450, present: true, source: 'MANUAL' },
      { startMinute: 500, present: false, source: 'AUTO' },
    ]);
  });

  it('aula cancelada dá presença à turma inteira; correção individual continua valendo', async () => {
    const { app, prisma } = setup();
    prisma.lessonCancellation.findMany.mockResolvedValue([
      { classGroupId: 20, date: dateOnly(MONDAY), startMinute: 450, reason: 'TEACHER_ABSENT' },
    ] as never);
    prisma.attendanceOverride.findMany.mockResolvedValue([
      { classGroupId: 20, studentId: 11, date: dateOnly(MONDAY), startMinute: 450, present: false },
    ] as never);

    const res = await day(app);

    expect(res.body.lessons[0].cancellation).toBe('TEACHER_ABSENT');
    expect(res.body.students[0].marks[0]).toEqual({ startMinute: 450, present: true, source: 'COLLECTIVE' });
    expect(res.body.students[1].marks[0]).toEqual({ startMinute: 450, present: false, source: 'MANUAL' });
    expect(res.body.students[0].marks[1]).toEqual({ startMinute: 500, present: false, source: 'AUTO' });
  });

  it('aluno que entrou na turma depois não aparece na chamada de antes', async () => {
    const { app, prisma } = setup();
    prisma.enrollment.findMany.mockResolvedValue([
      enrollment(10, 'Ana Souza'),
      enrollment(11, 'Bruno Lima', '2026-03-10'),
      enrollment(12, 'Carla Dias', '2026-02-02', MONDAY), // saiu no próprio dia: intervalo meio-aberto
    ] as never);

    const res = await day(app);

    expect(res.body.students.map((student: { id: number }) => student.id)).toEqual([10]);
  });

  it('usa a grade que valia na data, não a atual', async () => {
    const { app, prisma } = setup();
    prisma.timetableVersion.findMany.mockResolvedValue([
      version('2026-02-02'),
      { ...version('2026-03-16', [slot(1, 600, 650, PORT)]), id: 2 },
    ] as never);

    const before = await day(app, MONDAY);
    const after = await day(app, '2026-03-16');

    expect(before.body.lessons.map((lesson: { startMinute: number }) => lesson.startMinute)).toEqual([450, 500]);
    expect(after.body.lessons.map((lesson: { startMinute: number }) => lesson.startMinute)).toEqual([600]);
  });

  it('aula que ainda não terminou fica pendente, não vira falta', async () => {
    const { prisma } = setup();
    const classGroups = new ClassGroupsService(prisma);
    const service = new AttendanceService(prisma, classGroups, new CalendarService(prisma, { fetch: async () => [] }));

    // 08:00 de São Paulo: a 1ª aula (até 08:20) e a 2ª ainda não terminaram.
    const result = await service.day(school.id, 20, MONDAY, new Date(`${MONDAY}T08:00:00.000-03:00`));

    expect(result.lessons.map((lesson) => lesson.finished)).toEqual([false, false]);
    expect(result.students[0].marks).toEqual([
      { startMinute: 450, present: null, source: 'AUTO' },
      { startMinute: 500, present: null, source: 'AUTO' },
    ]);
  });

  it('turma de outra escola retorna 404', async () => {
    const { app, prisma } = setup();
    prisma.classGroup.findFirst.mockResolvedValue(null);

    expect((await day(app)).status).toBe(404);
    expect(prisma.classGroup.findFirst).toHaveBeenCalledWith({ where: { id: 20, schoolId: school.id } });
  });

  describe('correção manual', () => {
    const body = { classGroupId: 20, studentId: 10, date: MONDAY, startMinute: 450, present: true };
    const key = { classGroupId: 20, studentId: 10, date: dateOnly(MONDAY), startMinute: 450 };

    it('grava a correção com quem corrigiu', async () => {
      const { app, prisma } = setup();

      const res = await put(app, 'override', body);

      expect(res.status).toBe(204);
      expect(prisma.attendanceOverride.upsert).toHaveBeenCalledWith({
        where: { classGroupId_studentId_date_startMinute: key },
        create: { ...key, present: true, userId: schoolUser.id },
        update: { present: true, userId: schoolUser.id },
      });
    });

    it('present null desfaz a correção', async () => {
      const { app, prisma } = setup();

      const res = await put(app, 'override', { ...body, present: null });

      expect(res.status).toBe(204);
      expect(prisma.attendanceOverride.deleteMany).toHaveBeenCalledWith({ where: key });
      expect(prisma.attendanceOverride.upsert).not.toHaveBeenCalled();
    });

    it.each([
      ['horário sem aula', { ...body, startMinute: 600 }, 404, 'LESSON_NOT_FOUND'],
      ['dia sem aula na grade', { ...body, date: '2026-03-10' }, 404, 'LESSON_NOT_FOUND'],
      ['aluno fora da turma', { ...body, studentId: 99 }, 400, 'INVALID_STUDENT'],
      ['data inválida', { ...body, date: '2026-13-01' }, 400, 'VALIDATION_ERROR'],
    ])('recusa: %s', async (_case, payload, status, code) => {
      const { app, prisma } = setup();

      const res = await put(app, 'override', payload);

      expect(res.status).toBe(status);
      expect(res.body.code).toBe(code);
      expect(prisma.attendanceOverride.upsert).not.toHaveBeenCalled();
    });
  });

  describe('falta do professor e aula cancelada', () => {
    const body = { classGroupId: 20, date: MONDAY, startMinute: 450, reason: 'CANCELLED' };
    const key = { classGroupId: 20, date: dateOnly(MONDAY), startMinute: 450 };

    it('marca e desmarca a aula', async () => {
      const { app, prisma } = setup();

      expect((await put(app, 'cancellation', body)).status).toBe(204);
      expect(prisma.lessonCancellation.upsert).toHaveBeenCalledWith({
        where: { classGroupId_date_startMinute: key },
        create: { ...key, reason: 'CANCELLED', userId: schoolUser.id },
        update: { reason: 'CANCELLED', userId: schoolUser.id },
      });

      expect((await put(app, 'cancellation', { ...body, reason: null })).status).toBe(204);
      expect(prisma.lessonCancellation.deleteMany).toHaveBeenCalledWith({ where: key });
    });

    it('recusa motivo desconhecido e aula que não existe', async () => {
      const { app, prisma } = setup();

      expect((await put(app, 'cancellation', { ...body, reason: 'CHUVA' })).status).toBe(400);
      expect((await put(app, 'cancellation', { ...body, startMinute: 700 })).status).toBe(404);
      expect(prisma.lessonCancellation.upsert).not.toHaveBeenCalled();
    });
  });

  it('frequência por aluno e disciplina, com a situação em relação ao mínimo', async () => {
    const { app, prisma } = setup();
    // Duas segundas (09/03 e 16/03): Ana veio nas duas; Bruno só na primeira e saiu antes da 2ª aula.
    prisma.accessLog.findMany.mockResolvedValue([
      reading(10, '2026-03-09', '07:25'),
      reading(10, '2026-03-16', '07:25'),
      reading(11, '2026-03-09', '07:25'),
      reading(11, '2026-03-09', '08:21'),
    ] as never);

    const res = await request(app)
      .get('/api/attendance/summary?classGroupId=20&from=2026-03-09&to=2026-03-16')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ from: '2026-03-09', to: '2026-03-16', minAttendance: 75, subjects: [MATH, PORT] });
    expect(res.body.students).toEqual([
      {
        id: 10,
        name: 'Ana Souza',
        rm: '24010',
        given: 4,
        present: 4,
        percent: 100,
        status: 'OK',
        subjects: [
          { subjectId: 1, given: 2, present: 2, percent: 100, status: 'OK' },
          { subjectId: 2, given: 2, present: 2, percent: 100, status: 'OK' },
        ],
      },
      {
        id: 11,
        name: 'Bruno Lima',
        rm: '24011',
        given: 4,
        present: 1,
        percent: 25,
        status: 'BELOW',
        subjects: [
          { subjectId: 1, given: 2, present: 1, percent: 50, status: 'BELOW' },
          { subjectId: 2, given: 2, present: 0, percent: 0, status: 'BELOW' },
        ],
      },
    ]);
  });

  it('frequência recusa intervalo invertido', async () => {
    const { app } = setup();

    const res = await request(app)
      .get('/api/attendance/summary?classGroupId=20&from=2026-03-16&to=2026-03-09')
      .set('Authorization', authHeader());

    expect(res.status).toBe(400);
  });

  describe('frequência mínima da escola', () => {
    it('lê e altera', async () => {
      const { app, prisma } = setup();
      prisma.school.update.mockResolvedValue({ ...school, minAttendance: 80 });

      const read = await request(app).get('/api/settings').set('Authorization', authHeader());
      const write = await request(app).put('/api/settings').set('Authorization', authHeader()).send({ minAttendance: 80 });

      expect(read.body).toMatchObject({ minAttendance: 75, code: 'etec-jau', grading: { kind: 'NUMERIC', max: 10, passing: 6 } });
      expect(write.body).toMatchObject({ minAttendance: 80 });
      expect(prisma.school.update).toHaveBeenCalledWith({
        where: { id: school.id },
        data: { minAttendance: 80 },
        select: expect.objectContaining({ minAttendance: true, code: true, gradingKind: true }),
      });
    });

    it.each([101, -1, 72.5, 'abc'])('recusa %s', async (minAttendance) => {
      const { app, prisma } = setup();

      const res = await request(app).put('/api/settings').set('Authorization', authHeader()).send({ minAttendance });

      expect(res.status).toBe(400);
      expect(prisma.school.update).not.toHaveBeenCalled();
    });
  });

  it('migration habilita RLS nas tabelas de presença', () => {
    const sql = readFileSync(join(__dirname, '../prisma/migrations/20261112000000_attendance/migration.sql'), 'utf-8');
    for (const table of ['attendance_overrides', 'lesson_cancellations']) {
      expect(sql).toMatch(new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`));
    }
  });
});

describe('Presença: professor', () => {
  /** Ana Prado (professora 5) leciona só Matemática na turma. */
  const teacherUser: User = {
    ...schoolUser,
    id: 7,
    role: 'TEACHER',
    teacherId: 5,
    username: 'ana.prado@etec-jau',
    email: 'ana.prado@etec-jau.helpus.invalid',
  };

  it('vê só as aulas das disciplinas atribuídas a ele', async () => {
    const { app, prisma } = setup(teacherUser);

    const res = await day(app);

    expect(res.status).toBe(200);
    expect(res.body.lessons.map((lesson: { subject: { id: number } }) => lesson.subject.id)).toEqual([MATH.id]);
    expect(res.body.students[0].marks).toEqual([{ startMinute: 450, present: false, source: 'AUTO' }]);
    expect(prisma.teachingAssignment.findMany.mock.calls[0][0]!.where).toEqual({
      classGroupId: 20,
      teacherId: 5,
      classGroup: { schoolId: school.id },
    });
  });

  it('turma em que não leciona é 404', async () => {
    const { app, prisma } = setup(teacherUser);
    prisma.teachingAssignment.findMany.mockResolvedValueOnce([]);

    const res = await day(app);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CLASS_GROUP_NOT_FOUND');
  });

  it('não corrige aula de outra disciplina', async () => {
    const { app, prisma } = setup(teacherUser);

    const res = await put(app, 'override', { classGroupId: 20, date: MONDAY, startMinute: 500, studentId: 10, present: true });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('LESSON_NOT_FOUND');
    expect(prisma.attendanceOverride.upsert).not.toHaveBeenCalled();
  });

  it('corrige a própria aula', async () => {
    const { app, prisma } = setup(teacherUser);

    const res = await put(app, 'override', { classGroupId: 20, date: MONDAY, startMinute: 450, studentId: 10, present: true });

    expect(res.status).toBe(204);
    expect(prisma.attendanceOverride.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ userId: 7 }) }));
  });

  it('não vê a frequência da turma', async () => {
    const { app } = setup(teacherUser);

    const res = await request(app).get('/api/attendance/summary?classGroupId=20').set('Authorization', authHeader());

    expect(res.status).toBe(403);
  });

  it('lista as aulas dele no dia, em todas as turmas', async () => {
    const { app, prisma } = setup(teacherUser);
    prisma.teachingAssignment.findMany.mockResolvedValueOnce([{ subjectId: 1, classGroup: { id: 20, name: '2º DS A' } }] as never);

    const res = await request(app).get(`/api/attendance/my-lessons?date=${MONDAY}`).set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      date: MONDAY,
      day: { kind: 'SCHOOL_DAY' },
      classGroups: [{ id: 20, name: '2º DS A' }],
      lessons: [
        { startMinute: 450, endMinute: 500, subject: MATH, cancellation: null, finished: true, classGroup: { id: 20, name: '2º DS A' } },
      ],
    });
    expect(prisma.teachingAssignment.findMany.mock.calls[0][0]!.where).toEqual({
      teacherId: 5,
      classGroup: { schoolId: school.id, schoolYear: 2026 },
    });
  });

  it('escola não usa a lista de aulas do professor', async () => {
    const { app } = setup();

    const res = await request(app).get('/api/attendance/my-lessons').set('Authorization', authHeader());

    expect(res.status).toBe(403);
  });

  it('antes de trocar a senha inicial, nada funciona', async () => {
    const { app } = setup({ ...teacherUser, mustChangePassword: true });

    const res = await day(app);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });
});
