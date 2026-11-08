import request from 'supertest';
import { authHeader, buildTestApp, school, schoolUser, superAdmin } from './helpers';

const otherSchool = { id: 7 };

describe('Escola em uso (X-School-Id)', () => {
  describe('perfil SCHOOL', () => {
    it('SCHOOL sem cabeçalho usa a própria escola', async () => {
      const { app, prisma } = buildTestApp();
      prisma.course.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/courses').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(prisma.course.findMany.mock.calls[0][0]?.where).toEqual({ schoolId: school.id });
    });

    it('SCHOOL com X-School-Id da própria escola é aceito', async () => {
      const { app, prisma } = buildTestApp();
      prisma.course.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', String(school.id));

      expect(res.status).toBe(200);
    });

    it('SCHOOL com X-School-Id de outra escola recebe 403', async () => {
      const { app, prisma } = buildTestApp();

      const res = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', '7');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SCHOOL_FORBIDDEN');
      expect(prisma.course.findMany).not.toHaveBeenCalled();
    });

    it('SCHOOL com X-School-Id all recebe 403', async () => {
      const { app } = buildTestApp();

      const res = await request(app).get('/api/access-logs').set('Authorization', authHeader()).set('X-School-Id', 'all');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SCHOOL_FORBIDDEN');
    });
  });

  describe('perfil SUPER_ADMIN', () => {
    it('SUPER_ADMIN com X-School-Id 7 opera na escola 7', async () => {
      const { app, prisma } = buildTestApp({ user: superAdmin });
      prisma.school.findUnique.mockResolvedValue(otherSchool as never);
      prisma.course.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', '7');

      expect(res.status).toBe(200);
      expect(prisma.school.findUnique).toHaveBeenCalledWith({ where: { id: 7 }, select: { id: true } });
      expect(prisma.course.findMany.mock.calls[0][0]?.where).toEqual({ schoolId: 7 });
    });

    it('SUPER_ADMIN com escola inexistente recebe 404', async () => {
      const { app, prisma } = buildTestApp({ user: superAdmin });
      prisma.school.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', '99');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SCHOOL_NOT_FOUND');
    });

    it('SUPER_ADMIN sem cabeçalho usa a escola padrão', async () => {
      const { app, prisma } = buildTestApp({ user: superAdmin });
      prisma.course.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/courses').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(prisma.course.findMany.mock.calls[0][0]?.where).toEqual({ schoolId: school.id });
    });

    it('SUPER_ADMIN sem cabeçalho e sem escola padrão recebe 400', async () => {
      const { app } = buildTestApp({ user: { ...superAdmin, schoolId: null } });

      const res = await request(app).get('/api/courses').set('Authorization', authHeader());

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('SCHOOL_REQUIRED');
    });

    it('all é recusado em rotas de escrita', async () => {
      const { app, prisma } = buildTestApp({ user: superAdmin });

      const manual = await request(app)
        .post('/api/access-logs/manual')
        .set('Authorization', authHeader())
        .set('X-School-Id', 'all')
        .send({ rm: '24001' });
      const courses = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', 'all');

      expect(manual.status).toBe(400);
      expect(manual.body.code).toBe('SCHOOL_REQUIRED');
      expect(courses.status).toBe(400);
      expect(courses.body.code).toBe('SCHOOL_REQUIRED');
      expect(prisma.accessLog.create).not.toHaveBeenCalled();
    });
  });

  it.each(['abc', '0', '-1', '1.5'])('X-School-Id inválido (%p) recebe 400', async (value) => {
    const { app } = buildTestApp({ user: superAdmin });

    const res = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', value);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_SCHOOL_ID');
  });

  it('perfil sem acesso ao painel recebe 403', async () => {
    const { app } = buildTestApp({ user: { ...schoolUser, role: 'STUDENT' } });

    const courses = await request(app).get('/api/courses').set('Authorization', authHeader());
    const me = await request(app).get('/api/auth/me').set('Authorization', authHeader());

    expect(courses.status).toBe(403);
    expect(courses.body.code).toBe('NO_PANEL_ACCESS');
    expect(me.status).toBe(200);
  });

  it('perfil é relido a cada requisição', async () => {
    const { app, prisma } = buildTestApp({ user: superAdmin });
    prisma.school.findUnique.mockResolvedValue(otherSchool as never);
    prisma.course.findMany.mockResolvedValue([]);

    const first = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', '7');
    prisma.user.findUnique.mockResolvedValue({ ...superAdmin, role: 'SCHOOL', school } as never);
    const second = await request(app).get('/api/courses').set('Authorization', authHeader()).set('X-School-Id', '7');

    expect(first.status).toBe(200);
    expect(second.status).toBe(403);
    expect(second.body.code).toBe('SCHOOL_FORBIDDEN');
  });
});
