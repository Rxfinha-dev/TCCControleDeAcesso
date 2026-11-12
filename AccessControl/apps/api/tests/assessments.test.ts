import type { User } from '@prisma/client';
import request from 'supertest';
import { dateOnly } from '../src/lib/dates';
import { averages, gradeCell, isValidGrade, termOf, weightedAverage, type Grading } from '../src/modules/assessments/grades.rules';
import { authHeader, buildTestApp, classGroup, school, schoolUser } from './helpers';

const NUMERIC: Grading = { kind: 'NUMERIC', max: 10, decimals: 1, passing: 6, concepts: [] };
const CONCEPT: Grading = {
  kind: 'CONCEPT',
  max: 10,
  decimals: 1,
  passing: 2,
  concepts: [
    { label: 'MB', value: 4 },
    { label: 'B', value: 3 },
    { label: 'R', value: 2 },
    { label: 'I', value: 1 },
  ],
};
const TERMS = [
  { number: 1, startDate: '2026-02-02', endDate: '2026-04-17' },
  { number: 2, startDate: '2026-04-20', endDate: '2026-06-30' },
];

describe('Regras de notas e médias', () => {
  it('média bimestral é ponderada pelos pesos', () => {
    expect(weightedAverage([{ value: 8, weight: 2 }, { value: 5, weight: 1 }])).toBe(7);
    expect(weightedAverage([])).toBeNull();
  });

  it('semestral e anual são médias simples dos bimestres que têm nota', () => {
    const result = averages(
      [
        { term: 1, value: 8, weight: 1 },
        { term: 2, value: 5, weight: 1 },
        { term: 3, value: 4, weight: 1 },
      ],
      NUMERIC,
    );

    expect(result.terms.map((cell) => cell.label)).toEqual(['8,0', '5,0', '4,0', null]);
    expect(result.semesters).toEqual([
      { value: 6.5, label: '6,5', passed: true },
      { value: 4, label: '4,0', passed: false },
    ]);
    // (8 + 5 + 4) / 3 = 5,67 -> 5,7: abaixo de 6.
    expect(result.annual).toEqual({ value: 5.7, label: '5,7', passed: false });
  });

  it('sem nota não aprova nem reprova', () => {
    expect(averages([], NUMERIC).annual).toEqual({ value: null, label: null, passed: null });
  });

  it('conceitos: a média vira o conceito de valor mais próximo', () => {
    // (4 + 3 + 1) / 3 = 2,67 -> B (3).
    expect(gradeCell((4 + 3 + 1) / 3, CONCEPT)).toEqual({ value: 2.67, label: 'B', passed: true });
    expect(gradeCell(1.4, CONCEPT)).toMatchObject({ label: 'I', passed: false });
    // Empate entre B e R fica com o maior.
    expect(gradeCell(2.5, CONCEPT).label).toBe('B');
  });

  it('valida a nota contra o sistema da escola', () => {
    expect(isValidGrade(7.5, NUMERIC)).toBe(true);
    expect(isValidGrade(10.5, NUMERIC)).toBe(false);
    expect(isValidGrade(-1, NUMERIC)).toBe(false);
    expect(isValidGrade(7.55, NUMERIC)).toBe(false);
    expect(isValidGrade(3, CONCEPT)).toBe(true);
    expect(isValidGrade(2.5, CONCEPT)).toBe(false);
  });

  it('bimestre vem da data', () => {
    expect(termOf('2026-04-17', TERMS)).toBe(1);
    expect(termOf('2026-04-18', TERMS)).toBeNull();
    expect(termOf('2026-04-20', TERMS)).toBe(2);
  });
});

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const MONDAY = '2026-03-09';
const term = (number: number, startDate: string, endDate: string) => ({
  id: number,
  schoolId: school.id,
  schoolYear: 2026,
  number,
  startDate: dateOnly(startDate),
  endDate: dateOnly(endDate),
});
const assessment = (overrides: object = {}) => ({
  id: 40,
  classGroupId: classGroup.id,
  subjectId: MATH.id,
  kind: 'EXAM',
  date: dateOnly(MONDAY),
  startMinute: 450,
  title: 'Prova 1',
  content: 'Funções',
  note: null,
  weight: 2,
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  subject: MATH,
  ...overrides,
});
const input = { classGroupId: 20, subjectId: 1, kind: 'EXAM', date: MONDAY, startMinute: 450, title: 'Prova 1', content: 'Funções', weight: 2 };
const enrolled = (id: number, name: string) => ({
  studentId: id,
  startDate: dateOnly('2026-02-02'),
  endDate: null,
  student: { id, name, rm: String(24000 + id) },
});
const teacherUser: User = { ...schoolUser, id: 7, role: 'TEACHER', teacherId: 5, username: 'ana.prado@etec-jau' };

function setup(user?: User) {
  const ctx = buildTestApp({ user });
  const { prisma } = ctx;
  prisma.classGroup.findFirst.mockResolvedValue(classGroup);
  prisma.school.findUniqueOrThrow.mockResolvedValue(school);
  prisma.schoolTerm.findMany.mockResolvedValue([term(1, '2026-02-02', '2026-04-17'), term(2, '2026-04-20', '2026-06-30')]);
  prisma.teachingAssignment.count.mockResolvedValue(1);
  prisma.teachingAssignment.findMany.mockResolvedValue([{ subjectId: 1, subject: MATH }] as never);
  // Grade de segunda: MAT 07:30–08:20.
  prisma.nationalHoliday.count.mockResolvedValue(1);
  prisma.nationalHoliday.findMany.mockResolvedValue([]);
  prisma.holidayOverride.findMany.mockResolvedValue([]);
  prisma.noClassDay.findMany.mockResolvedValue([]);
  prisma.timetableVersion.findMany.mockResolvedValue([
    {
      id: 1,
      classGroupId: 20,
      validFrom: dateOnly('2026-02-02'),
      createdAt: new Date(),
      slots: [{ id: 1, versionId: 1, kind: 'LESSON', subjectId: 1, weekday: 1, startMinute: 450, endMinute: 500, subject: MATH }],
    },
  ] as never);
  prisma.enrollment.findMany.mockResolvedValue([enrolled(10, 'Ana Souza'), enrolled(11, 'Bruno Lima')] as never);
  prisma.attendanceOverride.findMany.mockResolvedValue([]);
  prisma.lessonCancellation.findMany.mockResolvedValue([]);
  prisma.accessLog.findMany.mockResolvedValue([]);
  prisma.assessment.create.mockResolvedValue(assessment() as never);
  prisma.assessment.findFirst.mockResolvedValue(assessment() as never);
  prisma.grade.findMany.mockResolvedValue([]);
  return ctx;
}
const api = (app: ReturnType<typeof buildTestApp>['app']) => ({
  get: (path: string) => request(app).get(`/api/assessments${path}`).set('Authorization', authHeader()),
  post: (body: object) => request(app).post('/api/assessments').set('Authorization', authHeader()).send(body),
  put: (path: string, body: object) => request(app).put(`/api/assessments${path}`).set('Authorization', authHeader()).send(body),
  del: (path: string) => request(app).delete(`/api/assessments${path}`).set('Authorization', authHeader()),
});

describe('Avaliações', () => {
  it('cria prova na aula da disciplina', async () => {
    const { app, prisma } = setup();

    const res = await api(app).post(input);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: 40,
      classGroupId: 20,
      kind: 'EXAM',
      date: MONDAY,
      startMinute: 450,
      title: 'Prova 1',
      content: 'Funções',
      note: null,
      weight: 2,
      subject: MATH,
    });
    expect(prisma.assessment.create.mock.calls[0][0].data).toMatchObject({ date: dateOnly(MONDAY), startMinute: 450, weight: 2, userId: 1 });
  });

  it('prova fora de uma aula da disciplina não salva', async () => {
    const { app, prisma } = setup();

    const res = await api(app).post({ ...input, startMinute: 500 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('NO_LESSON');
    expect(prisma.assessment.create).not.toHaveBeenCalled();
  });

  it('prova sem aula escolhida é recusada', async () => {
    const { app } = setup();

    const res = await api(app).post({ ...input, startMinute: null });

    expect(res.status).toBe(400);
  });

  it('trabalho só precisa da data (entrega), sem aula', async () => {
    const { app, prisma } = setup();

    // Terça: não há aula de Matemática, mas é trabalho.
    const res = await api(app).post({ ...input, kind: 'ASSIGNMENT', date: '2026-03-10', startMinute: 450 });

    expect(res.status).toBe(201);
    expect(prisma.assessment.create.mock.calls[0][0].data).toMatchObject({ kind: 'ASSIGNMENT', startMinute: null });
  });

  it('data fora dos bimestres é recusada', async () => {
    const { app } = setup();

    const res = await api(app).post({ ...input, kind: 'ASSIGNMENT', date: '2026-07-15' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('OUT_OF_TERM');
  });

  it('disciplina sem atribuição na turma é recusada', async () => {
    const { app, prisma } = setup();
    prisma.teachingAssignment.count.mockResolvedValue(0);

    const res = await api(app).post(input);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_SUBJECT');
  });

  it('lista as avaliações da turma com o nº de notas, as disciplinas e o sistema de notas', async () => {
    const { app, prisma } = setup();
    prisma.assessment.findMany.mockResolvedValue([{ ...assessment(), _count: { grades: 2 } }] as never);

    const res = await api(app).get('?classGroupId=20');

    expect(res.status).toBe(200);
    expect(res.body.grading).toEqual(NUMERIC);
    expect(res.body.subjects).toEqual([MATH]);
    expect(res.body.assessments).toEqual([expect.objectContaining({ id: 40, title: 'Prova 1', gradesCount: 2 })]);
  });

  it('exclui', async () => {
    const { app, prisma } = setup();

    const res = await api(app).del('/40');

    expect(res.status).toBe(204);
    expect(prisma.assessment.delete).toHaveBeenCalledWith({ where: { id: 40 } });
    expect(prisma.assessment.findFirst.mock.calls[0][0]!.where).toEqual({ id: 40, classGroup: { schoolId: school.id } });
  });
});

describe('Notas', () => {
  it('lista de lançamento: alunos da turma no dia, com a nota de cada um', async () => {
    const { app, prisma } = setup();
    prisma.grade.findMany.mockResolvedValue([{ assessmentId: 40, studentId: 10, value: 7.5 }] as never);

    const res = await api(app).get('/40/grades');

    expect(res.status).toBe(200);
    expect(res.body.students).toEqual([
      { id: 10, name: 'Ana Souza', rm: '24010', value: 7.5 },
      { id: 11, name: 'Bruno Lima', rm: '24011', value: null },
    ]);
  });

  it('lança, altera e apaga notas', async () => {
    const { app, prisma } = setup();

    const res = await api(app).put('/40/grades', { grades: [{ studentId: 10, value: 8.5 }, { studentId: 11, value: null }] });

    expect(res.status).toBe(204);
    expect(prisma.grade.upsert).toHaveBeenCalledWith({
      where: { assessmentId_studentId: { assessmentId: 40, studentId: 10 } },
      create: { assessmentId: 40, studentId: 10, value: 8.5, userId: 1 },
      update: { value: 8.5, userId: 1 },
    });
    expect(prisma.grade.deleteMany).toHaveBeenCalledWith({ where: { assessmentId: 40, studentId: 11 } });
  });

  it.each([
    [{ studentId: 10, value: 11 }, 'INVALID_GRADE'],
    [{ studentId: 10, value: 7.55 }, 'INVALID_GRADE'],
    [{ studentId: 99, value: 7 }, 'INVALID_STUDENT'],
  ])('recusa %o', async (grade, code) => {
    const { app, prisma } = setup();

    const res = await api(app).put('/40/grades', { grades: [grade] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(code);
    expect(prisma.grade.upsert).not.toHaveBeenCalled();
  });

  it('médias por bimestre, semestre e ano de cada aluno', async () => {
    const { app, prisma } = setup();
    prisma.assessment.findMany.mockResolvedValue([
      { ...assessment({ weight: 2 }), grades: [{ studentId: 10, value: 8 }] },
      { ...assessment({ id: 41, weight: 1, date: dateOnly('2026-03-16') }), grades: [{ studentId: 10, value: 5 }] },
      { ...assessment({ id: 42, weight: 1, date: dateOnly('2026-05-04') }), grades: [{ studentId: 10, value: 4 }] },
    ] as never);

    const res = await api(app).get('/report?classGroupId=20');

    expect(res.status).toBe(200);
    expect(res.body.subjects).toEqual([MATH]);
    const ana = res.body.students[0].subjects[0];
    // 1º bim: (8×2 + 5×1) / 3 = 7,0; 2º bim: 4,0; semestre e ano: 5,5.
    expect(ana.terms.map((cell: { label: string | null }) => cell.label)).toEqual(['7,0', '4,0', null, null]);
    expect(ana.semesters[0]).toEqual({ value: 5.5, label: '5,5', passed: false });
    expect(ana.annual).toEqual({ value: 5.5, label: '5,5', passed: false });
    // Bruno ainda não tem nota.
    expect(res.body.students[1].subjects[0].annual).toEqual({ value: null, label: null, passed: null });
  });
});

describe('Avaliações: professor', () => {
  it('só cria na disciplina atribuída a ele', async () => {
    const { app, prisma } = setup(teacherUser);

    await api(app).post(input);

    expect(prisma.teachingAssignment.count.mock.calls[0][0]!.where).toEqual({ classGroupId: 20, subjectId: 1, teacherId: 5 });
  });

  it('avaliação de outra disciplina é 404', async () => {
    const { app, prisma } = setup(teacherUser);
    prisma.teachingAssignment.count.mockResolvedValue(0);

    const res = await api(app).put('/40/grades', { grades: [{ studentId: 10, value: 8 }] });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ASSESSMENT_NOT_FOUND');
    expect(prisma.grade.upsert).not.toHaveBeenCalled();
  });

  it('lista só as avaliações das disciplinas dele', async () => {
    const { app, prisma } = setup(teacherUser);
    prisma.assessment.findMany.mockResolvedValue([]);

    await api(app).get('?classGroupId=20');

    expect(prisma.assessment.findMany.mock.calls[0][0]!.where).toEqual({ classGroupId: 20, subjectId: { in: [1] } });
  });
});

describe('Sistema de notas', () => {
  const put = (app: ReturnType<typeof buildTestApp>['app'], grading: object) =>
    request(app).put('/api/settings').set('Authorization', authHeader()).send({ grading });

  it('troca para conceitos, ordenados do maior para o menor', async () => {
    const { app, prisma } = setup();
    prisma.grade.count.mockResolvedValue(0);
    prisma.school.update.mockResolvedValue({ ...school, gradingKind: 'CONCEPT', passingGrade: 2, gradeConcepts: CONCEPT.concepts } as never);

    const res = await put(app, { kind: 'CONCEPT', passing: 2, concepts: [{ label: 'I', value: 1 }, { label: 'MB', value: 4 }, { label: 'R', value: 2 }, { label: 'B', value: 3 }] });

    expect(res.status).toBe(200);
    expect(res.body.grading).toMatchObject({ kind: 'CONCEPT', passing: 2, concepts: CONCEPT.concepts });
    expect(prisma.school.update.mock.calls[0][0].data).toEqual({ gradingKind: 'CONCEPT', passingGrade: 2, gradeConcepts: CONCEPT.concepts });
  });

  it('não muda depois da primeira nota', async () => {
    const { app, prisma } = setup();
    prisma.grade.count.mockResolvedValue(1);

    const res = await put(app, { kind: 'NUMERIC', max: 100, decimals: 0, passing: 60 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('GRADING_LOCKED');
    expect(prisma.school.update).not.toHaveBeenCalled();
  });

  it.each([
    [{ kind: 'NUMERIC', max: 50, decimals: 1, passing: 6 }],
    [{ kind: 'NUMERIC', max: 10, decimals: 1, passing: 11 }],
    [{ kind: 'CONCEPT', passing: 5, concepts: [{ label: 'A', value: 2 }, { label: 'B', value: 1 }] }],
    [{ kind: 'CONCEPT', passing: 1, concepts: [{ label: 'A', value: 1 }, { label: 'a', value: 2 }] }],
  ])('recusa %o', async (grading) => {
    const { app } = setup();

    expect((await put(app, grading)).status).toBe(400);
  });
});
