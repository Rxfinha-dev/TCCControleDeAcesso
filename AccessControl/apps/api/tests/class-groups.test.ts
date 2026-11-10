import request from 'supertest';
import type { ClassGroup } from '@prisma/client';
import { currentSchoolYear } from '../src/lib/dates';
import { authHeader, buildTestApp, school } from './helpers';

export const classGroup: ClassGroup = {
  id: 20,
  schoolId: school.id,
  name: '2º DS A',
  schoolYear: 2026,
  shift: 'MORNING',
  courseId: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};
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

  it('exclui turma sem alunos', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.enrollment.count.mockResolvedValue(0);

    const res = await request(app).delete('/api/class-groups/20').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.classGroup.delete).toHaveBeenCalledWith({ where: { id: 20 } });
  });
});
