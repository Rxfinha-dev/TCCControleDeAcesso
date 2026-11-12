import type { User } from '@prisma/client';
import request from 'supertest';
import { dateOnly } from '../src/lib/dates';
import { AssessmentsService } from '../src/modules/assessments/assessments.service';
import { AttendanceService } from '../src/modules/attendance/attendance.service';
import { CalendarService } from '../src/modules/calendar/calendar.service';
import { ClassGroupsService } from '../src/modules/class-groups/class-groups.service';
import { ReportCardService } from '../src/modules/report-card/report-card.service';
import { authHeader, buildTestApp, classGroup, school, schoolUser } from './helpers';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const PORT = { id: 2, name: 'Português', abbreviation: 'POR', color: '#aa3322' };
/** Quarta, 11/03/2026, 12:00 em São Paulo: as aulas da manhã de segunda (09/03) e de quarta já terminaram. */
const NOW = new Date('2026-03-11T12:00:00.000-03:00');
const studentUser: User = { ...schoolUser, id: 9, role: 'STUDENT', studentId: 10, username: '24010@etec-jau' };

const slot = (weekday: number, startMinute: number, subject: typeof MATH) => ({
  id: weekday * 1000 + startMinute,
  versionId: 1,
  kind: 'LESSON',
  subjectId: subject.id,
  weekday,
  startMinute,
  endMinute: startMinute + 50,
  subject,
});
const enrollment = (overrides: object = {}) => ({
  id: 1,
  classGroupId: classGroup.id,
  studentId: 10,
  schoolYear: 2026,
  startDate: dateOnly('2026-02-02'),
  endDate: null,
  createdAt: new Date(),
  classGroup: { id: classGroup.id, name: classGroup.name },
  student: { id: 10, name: 'Ana Souza', rm: '24010' },
  ...overrides,
});
const assessment = (overrides: object = {}) => ({
  id: 40,
  classGroupId: classGroup.id,
  subjectId: MATH.id,
  kind: 'EXAM',
  date: dateOnly('2026-03-09'),
  startMinute: 450,
  title: 'Prova 1',
  content: 'Funções',
  note: null,
  weight: 1,
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  subject: MATH,
  grades: [{ assessmentId: 40, studentId: 10, value: 7.5 }],
  ...overrides,
});

function setup(user?: User) {
  const ctx = buildTestApp({ user });
  const { prisma } = ctx;
  prisma.student.findFirst.mockResolvedValue({ id: 10, name: 'Ana Souza', rm: '24010', school: { name: school.name, minAttendance: 75 } } as never);
  prisma.classGroup.findFirst.mockResolvedValue(classGroup);
  prisma.school.findUniqueOrThrow.mockResolvedValue(school);
  prisma.nationalHoliday.count.mockResolvedValue(1);
  prisma.nationalHoliday.findMany.mockResolvedValue([]);
  prisma.holidayOverride.findMany.mockResolvedValue([]);
  prisma.noClassDay.findMany.mockResolvedValue([]);
  prisma.schoolTerm.findMany.mockResolvedValue([
    { id: 1, schoolId: school.id, schoolYear: 2026, number: 1, startDate: dateOnly('2026-03-09'), endDate: dateOnly('2026-04-17') },
  ]);
  // Segunda: MAT 07:30 e POR 08:20. Quarta: MAT 07:30.
  prisma.timetableVersion.findMany.mockResolvedValue([
    {
      id: 1,
      classGroupId: 20,
      validFrom: dateOnly('2026-02-02'),
      createdAt: new Date(),
      slots: [slot(1, 450, MATH), slot(1, 500, PORT), slot(3, 450, MATH)],
    },
  ] as never);
  // Bruno é colega de turma e faltou em tudo: nada dele pode aparecer no boletim da Ana.
  prisma.enrollment.findMany.mockResolvedValue([
    enrollment(),
    enrollment({ id: 2, studentId: 11, student: { id: 11, name: 'Bruno Lima', rm: '24011' } }),
  ] as never);
  prisma.attendanceOverride.findMany.mockResolvedValue([]);
  prisma.lessonCancellation.findMany.mockResolvedValue([]);
  // Ana veio na segunda (07:25 até o fim) e faltou na quarta.
  prisma.accessLog.findMany.mockResolvedValue([{ studentId: 10, createdAt: new Date('2026-03-09T07:25:00.000-03:00') }] as never);
  prisma.assessment.findMany.mockResolvedValue([assessment()] as never);
  const classGroups = new ClassGroupsService(prisma);
  const attendance = new AttendanceService(prisma, classGroups, new CalendarService(prisma, ctx.holidays));
  const service = new ReportCardService(prisma, attendance, new AssessmentsService(prisma, classGroups, attendance));
  return { ...ctx, service };
}

describe('Boletim', () => {
  it('junta frequência, notas e médias por disciplina até a data de emissão', async () => {
    const { service, prisma } = setup();

    const card = await service.reportCard(school.id, 10, NOW);

    expect(card).toMatchObject({
      school: { name: school.name },
      student: { id: 10, name: 'Ana Souza', rm: '24010' },
      classGroup: { id: 20, name: '2º DS A' },
      schoolYear: 2026,
      issuedOn: '2026-03-11',
      minAttendance: 75,
      // 3 aulas dadas (2 na segunda, 1 na quarta), 2 presenças.
      attendance: { given: 3, present: 2, percent: 66.7, status: 'BELOW' },
    });
    const [math, port] = card.subjects;
    expect(math.subject).toEqual(MATH);
    expect(math.attendance).toEqual({ given: 2, present: 1, percent: 50, status: 'BELOW' });
    expect(math.assessments).toEqual([
      { id: 40, kind: 'EXAM', title: 'Prova 1', date: '2026-03-09', weight: 1, term: 1, grade: { value: 7.5, label: '7,5', passed: true } },
    ]);
    expect(math.terms[0]).toEqual({ value: 7.5, label: '7,5', passed: true });
    expect(math.annual).toEqual({ value: 7.5, label: '7,5', passed: true });
    // Português: só frequência, ainda sem avaliação.
    expect(port.attendance).toEqual({ given: 1, present: 1, percent: 100, status: 'OK' });
    expect(port.annual).toEqual({ value: null, label: null, passed: null });
    // Só as notas do próprio aluno são lidas.
    expect(prisma.assessment.findMany.mock.calls[0][0]!.include).toMatchObject({ grades: { where: { studentId: 10 } } });
    expect(prisma.student.findFirst.mock.calls[0][0]!.where).toEqual({ id: 10, schoolId: school.id });
  });

  it('avaliação de uma turma feita depois que o aluno saiu dela não entra', async () => {
    const { service, prisma } = setup();
    prisma.enrollment.findMany.mockResolvedValue([enrollment({ endDate: dateOnly('2026-03-09') })] as never);

    const card = await service.reportCard(school.id, 10, NOW);

    expect(card.subjects.flatMap((subject) => subject.assessments)).toEqual([]);
  });

  it('aluno de outra escola é 404', async () => {
    const { app, prisma } = setup();
    prisma.student.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/report-cards/10').set('Authorization', authHeader());

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('STUDENT_NOT_FOUND');
  });

  it('aluno sem turma no ano recebe um boletim vazio', async () => {
    const { service, prisma } = setup();
    prisma.enrollment.findMany.mockResolvedValue([]);
    prisma.assessment.findMany.mockResolvedValue([]);

    const card = await service.reportCard(school.id, 10, NOW);

    expect(card.classGroup).toBeNull();
    expect(card.subjects).toEqual([]);
    expect(card.attendance).toMatchObject({ given: 0, percent: null });
  });
});

describe('Painel do aluno', () => {
  it('grade da semana com a prova marcada na aula e as próximas avaliações', async () => {
    const { service, prisma } = setup();
    prisma.assessment.findMany.mockResolvedValue([
      assessment(),
      assessment({ id: 41, kind: 'ASSIGNMENT', title: 'Lista 2', date: dateOnly('2026-03-13'), startMinute: null, grades: [] }),
    ] as never);

    const panel = await service.panel(school.id, 10, NOW);

    expect(panel.week.map((day) => day.date)).toEqual(['2026-03-09', '2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14']);
    const monday = panel.week[0];
    expect(monday.day).toEqual({ kind: 'SCHOOL_DAY' });
    expect(monday.lessons.map((lesson) => [lesson.startMinute, lesson.subject.abbreviation, lesson.assessments.map((item) => item.title)])).toEqual([
      [450, 'MAT', ['Prova 1']],
      [500, 'POR', []],
    ]);
    // Hoje é quarta: a prova de segunda já passou, a lista de sexta está por vir.
    expect(panel.upcoming.map((item) => item.title)).toEqual(['Lista 2']);
    expect(panel.reportCard.student.id).toBe(10);
  });

  it('aluno vê o próprio painel: o id vem do login', async () => {
    const { app, prisma } = setup(studentUser);

    const res = await request(app).get('/api/student/panel').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.reportCard.student).toEqual({ id: 10, name: 'Ana Souza', rm: '24010' });
    expect(prisma.student.findFirst.mock.calls[0][0]!.where).toEqual({ id: 10, schoolId: school.id });
  });

  it.each([
    ['/api/report-cards/11', 'boletim de outro aluno'],
    ['/api/attendance/day?classGroupId=20', 'chamada da turma'],
    ['/api/assessments?classGroupId=20', 'avaliações da turma'],
    ['/api/students', 'cadastro de alunos'],
  ])('aluno não acessa %s (%s)', async (path) => {
    const { app } = setup(studentUser);

    const res = await request(app).get(path).set('Authorization', authHeader());

    expect(res.status).toBe(403);
  });

  it('escola e professor não usam o painel do aluno', async () => {
    const { app } = setup();

    const res = await request(app).get('/api/student/panel').set('Authorization', authHeader());

    expect(res.status).toBe(403);
  });

  it('antes de trocar a senha inicial o painel não abre', async () => {
    const { app } = setup({ ...studentUser, mustChangePassword: true });

    const res = await request(app).get('/api/student/panel').set('Authorization', authHeader());

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });
});
