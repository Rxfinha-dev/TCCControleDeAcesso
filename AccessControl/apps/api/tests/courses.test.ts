import request from 'supertest';
import type { Course } from '@prisma/client';
import { authHeader, buildTestApp, school } from './helpers';

const course: Course = {
  id: 3,
  name: 'Desenvolvimento de Sistemas',
  schoolId: school.id,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Cursos', () => {
  it('exige autenticação', async () => {
    const { app } = buildTestApp();
    expect((await request(app).get('/api/courses')).status).toBe(401);
  });

  it('lista apenas os cursos da instituição logada', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findMany.mockResolvedValue([{ ...course, _count: { students: 2 } }] as never);

    const res = await request(app).get('/api/courses').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ id: 3, name: course.name, studentsCount: 2 });
    expect(prisma.course.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { schoolId: school.id } }));
  });

  it('cadastra um curso', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(null);
    prisma.course.create.mockResolvedValue(course);

    const res = await request(app).post('/api/courses').set('Authorization', authHeader()).send({ name: ' Desenvolvimento de Sistemas ' });

    expect(res.status).toBe(201);
    expect(prisma.course.create).toHaveBeenCalledWith({ data: { name: 'Desenvolvimento de Sistemas', schoolId: school.id } });
  });

  it('exige o nome preenchido', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/courses').set('Authorization', authHeader()).send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Preencha o campo nome');
  });

  it('recusa nome duplicado', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    const res = await request(app).post('/api/courses').set('Authorization', authHeader()).send({ name: course.name });
    expect(res.status).toBe(409);
  });

  it('não exclui curso com alunos vinculados', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.count.mockResolvedValue(4);

    const res = await request(app).delete('/api/courses/3').set('Authorization', authHeader());

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('COURSE_HAS_STUDENTS');
    expect(prisma.course.delete).not.toHaveBeenCalled();
  });

  it('exclui curso sem alunos', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.count.mockResolvedValue(0);

    const res = await request(app).delete('/api/courses/3').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.course.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it('retorna 404 para curso de outra instituição', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(null);
    const res = await request(app).put('/api/courses/99').set('Authorization', authHeader()).send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});
