import request from 'supertest';
import { Prisma } from '@prisma/client';
import { authHeader, buildTestApp, school, schoolUser, superAdmin } from './helpers';

const uniqueViolation = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });

describe('Escolas (super admin)', () => {
  it('apenas super admin acessa escolas', async () => {
    const { app, prisma } = buildTestApp();

    const res = await request(app).get('/api/schools').set('Authorization', authHeader());

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
    expect(prisma.school.findMany).not.toHaveBeenCalled();
  });

  it('lista escolas com contadores', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.school.findMany.mockResolvedValue([
      { ...school, _count: { students: 12, courses: 3, accessLogs: 40 }, users: [{ id: 1 }] },
      { ...school, id: 2, name: 'Escola Sem Login', email: 'sem@login.com', _count: { students: 0, courses: 0, accessLogs: 0 }, users: [] },
    ] as never);

    const res = await request(app).get('/api/schools').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(prisma.school.findMany.mock.calls[0][0]?.orderBy).toEqual({ name: 'asc' });
    expect(res.body[0]).toEqual({
      id: school.id,
      name: school.name,
      email: school.email,
      createdAt: school.createdAt.toISOString(),
      counts: { students: 12, courses: 3, accessLogs: 40 },
      hasLogin: true,
    });
    expect(res.body[1].hasLogin).toBe(false);
  });

  it('cria escola', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.user.findUnique.mockResolvedValueOnce({ ...superAdmin, school } as never).mockResolvedValueOnce(null);
    prisma.school.create.mockResolvedValue({ ...school, id: 3, name: 'Escola Nova', email: 'nova@escola.com' });

    const res = await request(app)
      .post('/api/schools')
      .set('Authorization', authHeader())
      .send({ name: ' Escola Nova ', email: 'Nova@Escola.com' });

    expect(res.status).toBe(201);
    expect(prisma.school.create).toHaveBeenCalledWith({ data: { name: 'Escola Nova', email: 'nova@escola.com' } });
    expect(res.body).toMatchObject({ id: 3, name: 'Escola Nova' });
  });

  it('recusa e-mail de outra escola', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.user.findUnique.mockResolvedValueOnce({ ...superAdmin, school } as never).mockResolvedValueOnce(null);
    prisma.school.create.mockRejectedValue(uniqueViolation());

    const res = await request(app).post('/api/schools').set('Authorization', authHeader()).send({ name: 'X', email: 'etec@escola.com' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_IN_USE');
  });

  it('recusa e-mail que já pertence a um usuário', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.user.findUnique
      .mockResolvedValueOnce({ ...superAdmin, school } as never)
      .mockResolvedValueOnce({ ...schoolUser, id: 8, email: 'pessoa@x.com', schoolId: 4 } as never);

    const res = await request(app).post('/api/schools').set('Authorization', authHeader()).send({ name: 'X', email: 'pessoa@x.com' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_IN_USE');
    expect(prisma.user.findUnique.mock.calls[1][0]).toEqual({ where: { email: 'pessoa@x.com' } });
    expect(prisma.school.create).not.toHaveBeenCalled();
  });

  it('editar mantendo o e-mail do próprio login de escola é aceito', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.user.findUnique.mockResolvedValueOnce({ ...superAdmin, school } as never).mockResolvedValueOnce(schoolUser);
    prisma.school.findUnique.mockResolvedValue(school);
    prisma.school.update.mockResolvedValue({ ...school, name: 'ETEC Renomeada' });

    const res = await request(app)
      .put(`/api/schools/${school.id}`)
      .set('Authorization', authHeader())
      .send({ name: 'ETEC Renomeada', email: school.email });

    expect(res.status).toBe(200);
    expect(prisma.school.update).toHaveBeenCalledWith({ where: { id: school.id }, data: { name: 'ETEC Renomeada', email: school.email } });
  });

  it('editar e-mail não altera o usuário', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.user.findUnique.mockResolvedValueOnce({ ...superAdmin, school } as never).mockResolvedValueOnce(null);
    prisma.school.findUnique.mockResolvedValue(school);
    prisma.school.update.mockResolvedValue({ ...school, email: 'contato@etec.com' });

    const res = await request(app)
      .put(`/api/schools/${school.id}`)
      .set('Authorization', authHeader())
      .send({ name: school.name, email: 'contato@etec.com' });

    expect(res.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('excluir remove fotos do storage e a escola', async () => {
    const { app, prisma, storage } = buildTestApp({ user: superAdmin });
    prisma.school.findUnique.mockResolvedValue(school);
    prisma.student.findMany.mockResolvedValue([
      { id: 10, photoKey: 'mem:10' },
      { id: 11, photoKey: 'mem:11' },
    ] as never);
    const removeSpy = jest.spyOn(storage, 'remove');

    const res = await request(app).delete(`/api/schools/${school.id}`).set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.student.findMany.mock.calls[0][0]?.where).toEqual({ schoolId: school.id, photoKey: { not: null } });
    expect(removeSpy).toHaveBeenCalledWith(10, 'mem:10');
    expect(removeSpy).toHaveBeenCalledWith(11, 'mem:11');
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({ where: { schoolId: school.id, role: 'SCHOOL' } });
    expect(prisma.school.delete).toHaveBeenCalledWith({ where: { id: school.id } });
  });

  it('excluir apaga os alunos antes da escola na mesma transação', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.school.findUnique.mockResolvedValue(school);
    prisma.student.findMany.mockResolvedValue([]);

    const res = await request(app).delete(`/api/schools/${school.id}`).set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.student.deleteMany).toHaveBeenCalledWith({ where: { schoolId: school.id } });
    // students.course_id é ON DELETE RESTRICT: os alunos saem antes da cascata de cursos.
    const operations: unknown = prisma.$transaction.mock.calls[0][0];
    expect(Array.isArray(operations)).toBe(true);
    expect(prisma.student.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(prisma.school.delete.mock.invocationCallOrder[0]);
  });

  it('excluir apaga as turmas antes da escola na mesma transação', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.school.findUnique.mockResolvedValue(school);
    prisma.student.findMany.mockResolvedValue([]);

    const res = await request(app).delete(`/api/schools/${school.id}`).set('Authorization', authHeader());

    expect(res.status).toBe(204);
    // Atribuições e blocos da grade apontam para professores/disciplinas com NO ACTION: saem junto com as turmas, antes.
    expect(prisma.classGroup.deleteMany).toHaveBeenCalledWith({ where: { schoolId: school.id } });
    expect(prisma.classGroup.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(prisma.school.delete.mock.invocationCallOrder[0]);
  });

  it('excluir não apaga as fotos se a exclusão no banco falhar', async () => {
    const { app, prisma, storage } = buildTestApp({ user: superAdmin });
    prisma.school.findUnique.mockResolvedValue(school);
    prisma.student.findMany.mockResolvedValue([{ id: 10, photoKey: 'mem:10' }] as never);
    prisma.$transaction.mockRejectedValue(new Error('violação de chave estrangeira'));
    const removeSpy = jest.spyOn(storage, 'remove');

    const res = await request(app).delete(`/api/schools/${school.id}`).set('Authorization', authHeader());

    expect(res.status).toBe(500);
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('excluir segue mesmo se o storage falhar', async () => {
    const { app, prisma, storage } = buildTestApp({ user: superAdmin });
    prisma.school.findUnique.mockResolvedValue(school);
    prisma.student.findMany.mockResolvedValue([{ id: 10, photoKey: 'mem:10' }] as never);
    jest.spyOn(storage, 'remove').mockRejectedValue(new Error('bucket fora do ar'));

    const res = await request(app).delete(`/api/schools/${school.id}`).set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.school.delete).toHaveBeenCalledWith({ where: { id: school.id } });
  });

  it('excluir escola inexistente retorna 404', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.school.findUnique.mockResolvedValue(null);

    const res = await request(app).delete('/api/schools/99').set('Authorization', authHeader());

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('SCHOOL_NOT_FOUND');
    expect(prisma.school.delete).not.toHaveBeenCalled();
  });
});
