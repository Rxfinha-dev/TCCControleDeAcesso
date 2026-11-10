import request from 'supertest';
import { dateOnly, todayInSaoPaulo } from '../src/lib/dates';
import { authHeader, buildTestApp, classGroup, school } from './helpers';

const today = dateOnly(todayInSaoPaulo());
const math = { id: 5, name: 'Matemática', abbreviation: 'Mat.', color: '#ffd9a8' };
const assignments = [{ subjectId: 5, teacher: { id: 8, name: 'Ana Prado' } }];
const lesson = { kind: 'LESSON', subjectId: 5, weekday: 1, startMinute: 450, endMinute: 500 };
const recess = { kind: 'BREAK', weekday: 1, startMinute: 550, endMinute: 570 };

function setup() {
  const ctx = buildTestApp();
  ctx.prisma.classGroup.findFirst.mockResolvedValue(classGroup);
  ctx.prisma.teachingAssignment.findMany.mockResolvedValue(assignments as never);
  ctx.prisma.classGroup.findMany.mockResolvedValue([]);
  return ctx;
}

const put = (app: Parameters<typeof request>[0], blocks: unknown[]) =>
  request(app).put('/api/class-groups/20/timetable').set('Authorization', authHeader()).send({ blocks });

describe('Grade semanal', () => {
  it.each([
    ['fim antes do início', { ...lesson, startMinute: 500, endMinute: 450 }],
    ['fim igual ao início', { ...lesson, endMinute: 450 }],
    ['minuto fora do passo de 5', { ...lesson, startMinute: 452 }],
    ['depois de 24:00', { ...lesson, endMinute: 1445 }],
    ['domingo', { ...lesson, weekday: 7 }],
    ['aula sem disciplina', { ...lesson, subjectId: null }],
    ['intervalo com disciplina', { ...recess, subjectId: 5 }],
  ])('recusa bloco inválido: %s', async (_name, block) => {
    const { app, prisma } = setup();
    const res = await put(app, [block]);
    expect(res.status).toBe(400);
    expect(prisma.timetableSlot.createMany).not.toHaveBeenCalled();
  });

  it('recusa aulas sobrepostas sem gravar nada', async () => {
    const { app, prisma } = setup();
    const res = await put(app, [lesson, { ...lesson, startMinute: 480, endMinute: 530 }]);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TIMETABLE_OVERLAP');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('recusa disciplina sem professor definido na turma', async () => {
    const { app, prisma } = setup();
    const res = await put(app, [{ ...lesson, subjectId: 6 }]);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SUBJECT_NOT_ASSIGNED');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cria a versão de hoje na primeira gravação do dia', async () => {
    const { app, prisma } = setup();
    prisma.timetableVersion.findUnique.mockResolvedValue(null);
    prisma.timetableVersion.create.mockResolvedValue({ id: 40, classGroupId: 20, validFrom: today, createdAt: new Date() });

    const res = await put(app, [lesson, recess]);

    expect(res.status).toBe(200);
    expect(prisma.timetableVersion.create).toHaveBeenCalledWith({ data: { classGroupId: 20, validFrom: today } });
    expect(prisma.timetableSlot.deleteMany).not.toHaveBeenCalled();
    expect(prisma.timetableSlot.createMany).toHaveBeenCalledWith({
      data: [
        { versionId: 40, kind: 'LESSON', subjectId: 5, weekday: 1, startMinute: 450, endMinute: 500 },
        { versionId: 40, kind: 'BREAK', subjectId: null, weekday: 1, startMinute: 550, endMinute: 570 },
      ],
    });
  });

  it('gravar de novo no mesmo dia substitui a versão de hoje', async () => {
    const { app, prisma } = setup();
    prisma.timetableVersion.findUnique.mockResolvedValue({ id: 40, classGroupId: 20, validFrom: today, createdAt: new Date() });

    await put(app, [lesson]);

    expect(prisma.timetableVersion.findUnique).toHaveBeenCalledWith({
      where: { classGroupId_validFrom: { classGroupId: 20, validFrom: today } },
    });
    expect(prisma.timetableVersion.create).not.toHaveBeenCalled();
    expect(prisma.timetableSlot.deleteMany).toHaveBeenCalledWith({ where: { versionId: 40 } });
    expect(prisma.timetableSlot.createMany).toHaveBeenCalled();
  });

  it('salva e avisa quando o professor está em outra turma no mesmo horário', async () => {
    const { app, prisma } = setup();
    prisma.timetableVersion.findUnique.mockResolvedValue(null);
    prisma.timetableVersion.create.mockResolvedValue({ id: 40, classGroupId: 20, validFrom: today, createdAt: new Date() });
    prisma.timetableVersion.findFirst.mockResolvedValue({
      id: 40,
      classGroupId: 20,
      validFrom: today,
      createdAt: new Date(),
      slots: [{ id: 1, versionId: 40, subject: math, ...lesson }],
    } as never);
    prisma.classGroup.findMany.mockResolvedValue([
      {
        id: 21,
        name: '2º DS B',
        assignments: [{ subjectId: 7, teacherId: 8, teacher: { name: 'Ana Prado' } }],
        timetableVersions: [{ slots: [{ subjectId: 7, weekday: 1, startMinute: 480, endMinute: 530 }] }],
      },
    ] as never);

    const res = await put(app, [lesson]);

    expect(res.status).toBe(200);
    expect(res.body.warnings).toEqual([
      { weekday: 1, startMinute: 450, endMinute: 500, teacherName: 'Ana Prado', classGroupName: '2º DS B' },
    ]);
    const where = prisma.classGroup.findMany.mock.calls[0][0]!.where;
    expect(where).toEqual({ schoolId: school.id, schoolYear: 2026, id: { not: 20 } });
  });

  it('turma sem grade devolve grade vazia', async () => {
    const { app, prisma } = setup();
    prisma.timetableVersion.findFirst.mockResolvedValue(null);

    const res = await request(app).get('/api/class-groups/20/timetable').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ validFrom: null, blocks: [], warnings: [] });
  });

  it('devolve a versão vigente hoje, com disciplina e professor de cada aula', async () => {
    const { app, prisma } = setup();
    prisma.timetableVersion.findFirst.mockResolvedValue({
      id: 40,
      classGroupId: 20,
      validFrom: dateOnly('2026-02-01'),
      createdAt: new Date(),
      slots: [
        { id: 1, versionId: 40, subject: math, ...lesson },
        { id: 2, versionId: 40, subject: null, subjectId: null, ...recess },
      ],
    } as never);

    const res = await request(app).get('/api/class-groups/20/timetable').set('Authorization', authHeader());

    expect(res.body).toEqual({
      validFrom: '2026-02-01',
      blocks: [
        { id: 1, kind: 'LESSON', weekday: 1, startMinute: 450, endMinute: 500, subject: math, teacher: { id: 8, name: 'Ana Prado' } },
        { id: 2, kind: 'BREAK', weekday: 1, startMinute: 550, endMinute: 570, subject: null, teacher: null },
      ],
      warnings: [],
    });
    const args = prisma.timetableVersion.findFirst.mock.calls[0][0]!;
    expect(args.where).toEqual({ classGroupId: 20, validFrom: { lte: today } });
    expect(args.orderBy).toEqual({ validFrom: 'desc' });
  });
});
