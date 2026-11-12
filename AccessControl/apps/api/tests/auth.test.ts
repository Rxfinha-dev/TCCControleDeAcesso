import request from 'supertest';
import { Prisma, type User } from '@prisma/client';
import { AUTH_USER_ID, SESSION_ID, authHeader, buildTestApp, school, schoolUser, superAdmin } from './helpers';

describe('Auth (Supabase)', () => {
  describe('GET /api/auth/me', () => {
    it('exige token', async () => {
      const { app } = buildTestApp();
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('recusa token inválido', async () => {
      const { app } = buildTestApp();
      const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('recusa token de sessão encerrada (logout ou troca de senha)', async () => {
      const { app, identity } = buildTestApp();
      identity.revokedSessions.add(SESSION_ID);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('retorna o usuário com perfil e escola', async () => {
      const { app, prisma } = buildTestApp();

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: schoolUser.id,
        name: schoolUser.name,
        email: schoolUser.email,
        role: 'SCHOOL',
        school: { id: school.id, name: school.name },
        username: null,
        mustChangePassword: false,
      });
      expect(prisma.user.findUnique.mock.calls[0][0]).toEqual({ where: { authUserId: AUTH_USER_ID }, include: { school: true } });
    });
  });

  describe('Primeiro acesso', () => {
    const newUser = (overrides: Partial<User> = {}) => ({ ...schoolUser, id: 5, ...overrides });

    it('primeiro acesso cria escola e usuário SCHOOL', async () => {
      const { app, prisma, identity } = buildTestApp();
      identity.user = { ...identity.user, email: 'nova@escola.com', name: 'Escola Nova' };
      const created = newUser({ email: 'nova@escola.com', name: 'Escola Nova', schoolId: 2 });
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.school.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValue({ ...created, school: { ...school, id: 2, name: 'Escola Nova' } } as never);
      prisma.user.findUnique.mockResolvedValue({ ...created, school: { ...school, id: 2, name: 'Escola Nova' } } as never);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(prisma.user.create.mock.calls[0][0]).toEqual({
        data: {
          authUserId: AUTH_USER_ID,
          email: 'nova@escola.com',
          name: 'Escola Nova',
          role: 'SCHOOL',
          school: { create: { name: 'Escola Nova', email: 'nova@escola.com' } },
        },
        include: { school: true },
      });
      expect(res.body).toMatchObject({ role: 'SCHOOL', school: { id: 2, name: 'Escola Nova' } });
    });

    it('primeiro acesso vincula escola criada pelo super admin', async () => {
      const { app, prisma } = buildTestApp();
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.school.findUnique.mockResolvedValueOnce({ ...school, users: [] } as never);
      prisma.user.create.mockResolvedValue({ ...schoolUser, school } as never);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(prisma.user.create.mock.calls[0][0]).toEqual({
        data: { authUserId: AUTH_USER_ID, email: school.email, name: school.name, role: 'SCHOOL', schoolId: school.id },
        include: { school: true },
      });
      expect(prisma.school.create).not.toHaveBeenCalled();
    });

    it('não vincula escola que já tem login de escola', async () => {
      const { app, prisma } = buildTestApp();
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.school.findUnique.mockResolvedValueOnce({ ...school, users: [{ id: 9 }] } as never);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_IN_USE');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('e-mail de bootstrap nasce SUPER_ADMIN', async () => {
      const { app, prisma, identity } = buildTestApp();
      identity.user = { ...identity.user, email: 'RafaelHenriqueOliveira1234@gmail.com', name: 'Rafael' };
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.school.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValue({ ...superAdmin, school } as never);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(prisma.user.create.mock.calls[0][0].data).toMatchObject({
        email: 'rafaelhenriqueoliveira1234@gmail.com',
        role: 'SUPER_ADMIN',
        school: { create: { name: 'Rafael', email: 'rafaelhenriqueoliveira1234@gmail.com' } },
      });
    });

    it('exige e-mail confirmado no Supabase', async () => {
      const { app, prisma, identity } = buildTestApp();
      identity.user = { ...identity.user, emailConfirmed: false };
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('usa o vínculo criado por uma requisição simultânea', async () => {
      const { app, prisma } = buildTestApp();
      prisma.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...schoolUser, school } as never)
        .mockResolvedValue({ ...schoolUser, school } as never);
      prisma.school.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
      );

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(schoolUser.id);
    });

    it('e-mail já usado por outra conta do Supabase recebe 409', async () => {
      const { app, prisma } = buildTestApp();
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.school.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
      );

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_IN_USE');
    });
  });
});
