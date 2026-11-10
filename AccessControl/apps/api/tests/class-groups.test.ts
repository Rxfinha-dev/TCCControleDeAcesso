import request from 'supertest';
import { currentSchoolYear, dateOnly, todayInSaoPaulo } from '../src/lib/dates';
import { authHeader, buildTestApp, classGroup, school } from './helpers';

const course = { id: 3, name: 'DS', schoolId: school.id, createdAt: new Date(), updatedAt: new Date() };
const body = { name: ' 2º DS A ', schoolYear: 2026, shift: 'MORNING', courseId: 3 };

describe('Turmas', () => {
  it('lista as turmas do ano pedido, com curso e alunos ativos', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findMany.mockResolvedValue([
      { ...classGroup, course: { id: 3, name: 'DS' }, _count: { enrollments: 31 } },
    ] as never);

    const res = await request(app).get('/api/class-groups?schoolYear=2026').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 20, name: '2º DS A', schoolYear: 2026, shift: 'MORNING', course: { id: 3, name: 'DS' }, studentsCount: 31 },
    ]);
    const args = prisma.classGroup.findMany.mock.calls[0][0]!;
    expect(args.where).toEqual({ schoolId: school.id, schoolYear: 2026 });
  });

  it('sem ano na busca, usa o ano letivo atual', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findMany.mockResolvedValue([]);

    await request(app).get('/api/class-groups').set('Authorization', authHeader());

    expect(prisma.classGroup.findMany.mock.calls[0][0]!.where).toEqual({
      schoolId: school.id,
      schoolYear: currentSchoolYear(),
    });
  });

  it('cadastra turma sem curso (ensino regular)', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(null);
    prisma.classGroup.create.mockResolvedValue({ ...classGroup, courseId: null, course: null } as never);

    const res = await request(app)
      .post('/api/class-groups')
      .set('Authorization', authHeader())
      .send({ ...body, name: '9º ano B', courseId: null });

    expect(res.status).toBe(201);
    expect(prisma.course.findFirst).not.toHaveBeenCalled();
    expect(prisma.classGroup.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: '9º ano B', schoolYear: 2026, shift: 'MORNING', courseId: null, schoolId: school.id },
      }),
    );
  });

  it('recusa curso de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/api/class-groups').set('Authorization', authHeader()).send(body);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_COURSE');
    expect(prisma.course.findFirst).toHaveBeenCalledWith({ where: { id: 3, schoolId: school.id } });
    expect(prisma.classGroup.create).not.toHaveBeenCalled();
  });

  it('recusa turno inválido', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/class-groups')
      .set('Authorization', authHeader())
      .send({ ...body, shift: 'MADRUGADA' });
    expect(res.status).toBe(400);
  });

  it('recusa nome repetido no mesmo ano, sem diferenciar maiúsculas', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);

    const res = await request(app)
      .post('/api/class-groups')
      .set('Authorization', authHeader())
      .send({ ...body, name: '2º ds a' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CLASS_GROUP_EXISTS');
    expect(prisma.classGroup.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: school.id, schoolYear: 2026, name: { equals: '2º ds a', mode: 'insensitive' } }),
      }),
    );
  });

  it('aceita o mesmo nome em outro ano letivo', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.classGroup.findFirst.mockResolvedValue(null);
    prisma.classGroup.create.mockResolvedValue({ ...classGroup, schoolYear: 2027, course: null } as never);

    const res = await request(app)
      .post('/api/class-groups')
      .set('Authorization', authHeader())
      .send({ ...body, schoolYear: 2027 });

    expect(res.status).toBe(201);
    expect(prisma.classGroup.findFirst.mock.calls[0][0]!.where).toMatchObject({ schoolYear: 2027 });
  });

  it('mostra a turma com as disciplinas e professores', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue({
      ...classGroup,
      course: { id: 3, name: 'DS' },
      _count: { enrollments: 2 },
      assignments: [
        {
          subject: { id: 5, name: 'Matemática', abbreviation: 'Mat.', color: '#ffd9a8' },
          teacher: { id: 8, name: 'Ana Prado' },
        },
      ],
    } as never);

    const res = await request(app).get('/api/class-groups/20').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 20,
      studentsCount: 2,
      assignments: [
        {
          subject: { id: 5, name: 'Matemática', abbreviation: 'Mat.', color: '#ffd9a8' },
          teacher: { id: 8, name: 'Ana Prado' },
        },
      ],
    });
    expect(prisma.classGroup.findFirst.mock.calls[0][0]!.where).toEqual({ id: 20, schoolId: school.id });
  });

  it('recusa id acima do limite do banco com 400, não 500', async () => {
    const { app, prisma } = buildTestApp();
    const res = await request(app).delete('/api/class-groups/20/students/9999999999').set('Authorization', authHeader());
    expect(res.status).toBe(400);
    expect(prisma.classGroup.findFirst).not.toHaveBeenCalled();
  });

  it('retorna 404 para turma de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(null);
    const res = await request(app).get('/api/class-groups/99').set('Authorization', authHeader());
    expect(res.status).toBe(404);
  });

  it('não exclui turma que já teve alunos', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.count.mockResolvedValue(1);

    const res = await request(app).delete('/api/class-groups/20').set('Authorization', authHeader());

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CLASS_GROUP_HAS_STUDENTS');
    expect(prisma.enrollment.count).toHaveBeenCalledWith({ where: { classGroupId: 20 } });
    expect(prisma.classGroup.delete).not.toHaveBeenCalled();
  });

  it('não muda o ano letivo de turma que já teve alunos', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValueOnce(classGroup).mockResolvedValueOnce(null);
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.enrollment.count.mockResolvedValue(2);

    const res = await request(app)
      .put('/api/class-groups/20')
      .set('Authorization', authHeader())
      .send({ ...body, schoolYear: classGroup.schoolYear + 1 });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CLASS_GROUP_HAS_STUDENTS');
    expect(prisma.classGroup.update).not.toHaveBeenCalled();
  });

  it('exclui turma sem alunos', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.count.mockResolvedValue(0);

    const res = await request(app).delete('/api/class-groups/20').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.classGroup.delete).toHaveBeenCalledWith({ where: { id: 20 } });
  });
});

describe('Copiar turmas do ano anterior', () => {
  const source = {
    ...classGroup,
    schoolYear: 2025,
    assignments: [{ id: 1, classGroupId: 20, subjectId: 5, teacherId: 8, createdAt: new Date(), updatedAt: new Date() }],
    timetableVersions: [
      {
        id: 40,
        classGroupId: 20,
        validFrom: dateOnly('2025-02-01'),
        createdAt: new Date(),
        slots: [{ id: 1, versionId: 40, kind: 'LESSON', subjectId: 5, weekday: 1, startMinute: 450, endMinute: 500 }],
      },
    ],
  };

  it('copia nome, turno, curso, professores e grade vigente, sem alunos', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findMany
      .mockResolvedValueOnce([source, { ...source, id: 21, name: '3º DS A' }] as never)
      .mockResolvedValueOnce([{ name: '3º ds a' }] as never);
    prisma.classGroup.create.mockResolvedValue({ ...classGroup, id: 30, schoolYear: 2026 });
    prisma.timetableVersion.create.mockResolvedValue({ id: 50, classGroupId: 30, validFrom: new Date(), createdAt: new Date() });

    const res = await request(app)
      .post('/api/class-groups/copy')
      .set('Authorization', authHeader())
      .send({ fromYear: 2025, toYear: 2026 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ created: 1, skipped: ['3º DS A'] });
    expect(prisma.classGroup.create).toHaveBeenCalledTimes(1);
    expect(prisma.classGroup.create).toHaveBeenCalledWith({
      data: { schoolId: school.id, schoolYear: 2026, name: '2º DS A', shift: 'MORNING', courseId: 3 },
    });
    expect(prisma.teachingAssignment.createMany).toHaveBeenCalledWith({
      data: [{ classGroupId: 30, subjectId: 5, teacherId: 8 }],
    });
    expect(prisma.timetableVersion.create).toHaveBeenCalledWith({
      data: { classGroupId: 30, validFrom: dateOnly(todayInSaoPaulo()) },
    });
    expect(prisma.timetableSlot.createMany).toHaveBeenCalledWith({
      data: [{ versionId: 50, kind: 'LESSON', subjectId: 5, weekday: 1, startMinute: 450, endMinute: 500 }],
    });
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
    expect(prisma.classGroup.findMany.mock.calls[0][0]!.where).toEqual({ schoolId: school.id, schoolYear: 2025 });
  });

  it('recusa copiar um ano para ele mesmo', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/class-groups/copy')
      .set('Authorization', authHeader())
      .send({ fromYear: 2026, toYear: 2026 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_YEAR');
  });
});
