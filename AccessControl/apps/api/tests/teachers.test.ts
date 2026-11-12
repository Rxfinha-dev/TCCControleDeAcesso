import request from 'supertest';
import type { Teacher } from '@prisma/client';
import { authHeader, buildTestApp, school } from './helpers';

const teacher: Teacher = {
  id: 8,
  schoolId: school.id,
  name: 'Ana Prado',
  contactEmail: 'ana@email.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Professores', () => {
  it('lista só os professores da escola, com o número de atribuições', async () => {
    const { app, prisma } = buildTestApp();
    prisma.teacher.findMany.mockResolvedValue([{ ...teacher, _count: { assignments: 2 } }] as never);

    const res = await request(app).get('/api/teachers').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 8, name: 'Ana Prado', contactEmail: 'ana@email.com', assignmentsCount: 2, username: null }]);
    expect(prisma.teacher.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { schoolId: school.id } }));
  });

  it('cadastra sem e-mail de contato', async () => {
    const { app, prisma } = buildTestApp();
    prisma.teacher.create.mockResolvedValue({ ...teacher, contactEmail: null });

    const res = await request(app)
      .post('/api/teachers')
      .set('Authorization', authHeader())
      .send({ name: ' Ana Prado ', contactEmail: '' });

    expect(res.status).toBe(201);
    expect(prisma.teacher.create).toHaveBeenCalledWith({
      data: { name: 'Ana Prado', contactEmail: null, schoolId: school.id },
    });
  });

  it('exige o nome', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/teachers').set('Authorization', authHeader()).send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Informe o nome do professor');
  });

  it('recusa e-mail inválido', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/teachers')
      .set('Authorization', authHeader())
      .send({ name: 'Ana', contactEmail: 'ana@' });
    expect(res.status).toBe(400);
  });

  it('edita o professor da escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.teacher.findFirst.mockResolvedValue(teacher);
    prisma.teacher.update.mockResolvedValue({ ...teacher, name: 'Ana P. Prado' });

    const res = await request(app)
      .put('/api/teachers/8')
      .set('Authorization', authHeader())
      .send({ name: 'Ana P. Prado', contactEmail: 'ana@email.com' });

    expect(res.status).toBe(200);
    expect(prisma.teacher.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { name: 'Ana P. Prado', contactEmail: 'ana@email.com' },
    });
  });

  it('retorna 404 para professor de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.teacher.findFirst.mockResolvedValue(null);
    const res = await request(app).delete('/api/teachers/99').set('Authorization', authHeader());
    expect(res.status).toBe(404);
  });

  it('não exclui professor com disciplinas atribuídas', async () => {
    const { app, prisma } = buildTestApp();
    prisma.teacher.findFirst.mockResolvedValue(teacher);
    prisma.teachingAssignment.count.mockResolvedValue(3);

    const res = await request(app).delete('/api/teachers/8').set('Authorization', authHeader());

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('TEACHER_IN_USE');
    expect(prisma.teacher.delete).not.toHaveBeenCalled();
  });
});
