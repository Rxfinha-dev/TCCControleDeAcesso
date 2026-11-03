import request from 'supertest';
import { Prisma } from '@prisma/client';
import { AUTH_USER_ID, SESSION_ID, authHeader, buildTestApp, school } from './helpers';

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

    it('retorna a instituição vinculada ao usuário do Supabase', async () => {
      const { app, prisma } = buildTestApp();

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: school.id, name: school.name, email: school.email });
      expect(prisma.school.findUnique.mock.calls[0][0]).toEqual({ where: { authUserId: AUTH_USER_ID } });
    });
  });

  describe('Primeiro acesso', () => {
    it('cria a instituição com o nome informado no cadastro', async () => {
      const { app, prisma, identity } = buildTestApp();
      identity.user = { ...identity.user, email: 'nova@escola.com', name: 'Escola Nova' };
      prisma.school.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      const created = { ...school, id: 2, name: 'Escola Nova', email: 'nova@escola.com' };
      prisma.school.create.mockResolvedValue(created);
      prisma.school.findUnique.mockResolvedValueOnce(created);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(prisma.school.create.mock.calls[0][0].data).toEqual({
        name: 'Escola Nova',
        email: 'nova@escola.com',
        authUserId: AUTH_USER_ID,
      });
      expect(res.body).toEqual({ id: 2, name: 'Escola Nova', email: 'nova@escola.com' });
    });

    it('vincula a instituição já existente com o mesmo e-mail (dados do sistema antigo)', async () => {
      const { app, prisma } = buildTestApp();
      const legacy = { ...school, authUserId: null };
      prisma.school.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(legacy);
      prisma.school.update.mockResolvedValue(school);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(prisma.school.update).toHaveBeenCalledWith({ where: { id: school.id }, data: { authUserId: AUTH_USER_ID } });
      expect(prisma.school.create).not.toHaveBeenCalled();
    });

    it('não vincula e-mail que já pertence a outro usuário', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...school, authUserId: '00000000-0000-4000-8000-000000000000' });

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_IN_USE');
      expect(prisma.school.update).not.toHaveBeenCalled();
    });

    it('exige e-mail confirmado no Supabase', async () => {
      const { app, prisma, identity } = buildTestApp();
      identity.user = { ...identity.user, emailConfirmed: false };
      prisma.school.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
      expect(prisma.school.create).not.toHaveBeenCalled();
    });

    it('usa o vínculo criado por uma requisição simultânea', async () => {
      const { app, prisma } = buildTestApp();
      prisma.school.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(school);
      prisma.school.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }),
      );

      const res = await request(app).get('/api/auth/me').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(school.id);
    });
  });
});
