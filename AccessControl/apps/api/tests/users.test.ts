import request from 'supertest';
import { Prisma } from '@prisma/client';
import { authHeader, buildTestApp, school, schoolUser, superAdmin } from './helpers';

const otherAdmin = { ...superAdmin, id: 3, email: 'outro@admin.com', authUserId: '11111111-1111-4111-8111-111111111111' };

/** O primeiro findUnique é o do middleware (usuário logado); o segundo é o alvo da alteração. */
function mockTarget(prisma: ReturnType<typeof buildTestApp>['prisma'], target: unknown) {
  prisma.user.findUnique.mockResolvedValueOnce({ ...superAdmin, school } as never).mockResolvedValueOnce(target as never);
}

describe('Usuários (super admin)', () => {
  it('apenas super admin acessa usuários', async () => {
    const { app, prisma } = buildTestApp();

    const res = await request(app).get('/api/users').set('Authorization', authHeader());

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ROLE');
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('lista com filtro de busca', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.user.findMany.mockResolvedValue([{ ...schoolUser, school: { id: school.id, name: school.name } }] as never);

    const res = await request(app).get('/api/users?search=etec&role=SCHOOL').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    const args = prisma.user.findMany.mock.calls[0][0]!;
    expect(args.where).toEqual({
      role: 'SCHOOL',
      OR: [{ name: { contains: 'etec', mode: 'insensitive' } }, { email: { contains: 'etec', mode: 'insensitive' } }],
    });
    expect(args.take).toBe(200);
    expect(res.body[0]).toEqual({
      id: schoolUser.id,
      name: schoolUser.name,
      email: schoolUser.email,
      role: 'SCHOOL',
      school: { id: school.id, name: school.name },
      createdAt: schoolUser.createdAt.toISOString(),
    });
  });

  it('promove usuário SCHOOL a SUPER_ADMIN', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    mockTarget(prisma, schoolUser);
    prisma.user.update.mockResolvedValue({ ...schoolUser, role: 'SUPER_ADMIN', school } as never);

    const res = await request(app).patch(`/api/users/${schoolUser.id}`).set('Authorization', authHeader()).send({ role: 'SUPER_ADMIN' });

    expect(res.status).toBe(200);
    expect(prisma.user.update.mock.calls[0][0]).toMatchObject({ where: { id: schoolUser.id }, data: { role: 'SUPER_ADMIN' } });
    expect(res.body.role).toBe('SUPER_ADMIN');
  });

  it('não permite rebaixar a si mesmo', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    mockTarget(prisma, superAdmin);

    const res = await request(app).patch(`/api/users/${superAdmin.id}`).set('Authorization', authHeader()).send({ role: 'SCHOOL' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CANNOT_DEMOTE_SELF');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('não permite rebaixar o último super admin', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    mockTarget(prisma, otherAdmin);
    prisma.user.count.mockResolvedValue(1);

    const res = await request(app).patch(`/api/users/${otherAdmin.id}`).set('Authorization', authHeader()).send({ role: 'SCHOOL' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('LAST_SUPER_ADMIN');
    expect(prisma.user.count).toHaveBeenCalledWith({ where: { role: 'SUPER_ADMIN' } });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rebaixa outro super admin quando há mais de um', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    mockTarget(prisma, { ...otherAdmin, schoolId: 4 });
    prisma.user.count.mockResolvedValue(2);
    prisma.user.update.mockResolvedValue({ ...otherAdmin, role: 'SCHOOL', schoolId: 4, school: { ...school, id: 4 } } as never);

    const res = await request(app).patch(`/api/users/${otherAdmin.id}`).set('Authorization', authHeader()).send({ role: 'SCHOOL' });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('SCHOOL');
  });

  it('rebaixar sem escola retorna 400', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    mockTarget(prisma, { ...otherAdmin, schoolId: null });
    prisma.user.count.mockResolvedValue(2);

    const res = await request(app).patch(`/api/users/${otherAdmin.id}`).set('Authorization', authHeader()).send({ role: 'SCHOOL' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('SCHOOL_REQUIRED');
  });

  it('rebaixar para escola que já tem login retorna 409', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    mockTarget(prisma, otherAdmin);
    prisma.user.count.mockResolvedValue(2);
    prisma.user.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
    );

    const res = await request(app).patch(`/api/users/${otherAdmin.id}`).set('Authorization', authHeader()).send({ role: 'SCHOOL' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SCHOOL_HAS_LOGIN');
  });

  it('usuário inexistente retorna 404', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    mockTarget(prisma, null);

    const res = await request(app).patch('/api/users/99').set('Authorization', authHeader()).send({ role: 'SUPER_ADMIN' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('perfis futuros não são aceitos', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });

    const res = await request(app).patch(`/api/users/${schoolUser.id}`).set('Authorization', authHeader()).send({ role: 'STUDENT' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
