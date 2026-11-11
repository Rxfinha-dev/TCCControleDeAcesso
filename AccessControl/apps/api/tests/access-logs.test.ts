import request from 'supertest';
import type { AccessLog } from '@prisma/client';
import { authHeader, buildTestApp, makeStudent, school, superAdmin } from './helpers';

const log: AccessLog = {
  id: 1,
  schoolId: school.id,
  studentId: 10,
  studentName: 'Ana Souza',
  method: 'FINGERPRINT',
  createdAt: new Date('2026-03-10T11:00:00Z'),
};

describe('Entradas', () => {
  it('registra entrada pela digital encontrada no sensor', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(makeStudent({ fingerprintId: 5 }) as never);
    prisma.accessLog.create.mockResolvedValue(log);

    const res = await request(app).post('/api/access-logs/fingerprint').set('Authorization', authHeader()).send({ fingerprintId: 5 });

    expect(res.status).toBe(201);
    expect(res.body.student).toMatchObject({ name: 'Ana Souza', rm: '24001', course: { name: 'Desenvolvimento de Sistemas' } });
    // Só digital com cadastro concluído: uma posição reservada e não confirmada ainda guarda o dedo do dono anterior no sensor.
    expect(prisma.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: school.id, fingerprintId: 5, fingerprintEnrolledAt: { not: null } } }),
    );
    expect(prisma.accessLog.create).toHaveBeenCalledWith({
      data: { schoolId: school.id, studentId: 10, studentName: 'Ana Souza', method: 'FINGERPRINT' },
    });
  });

  it('recusa posição acima da capacidade do sensor', async () => {
    const { app, prisma } = buildTestApp();

    const res = await request(app).post('/api/access-logs/fingerprint').set('Authorization', authHeader()).send({ fingerprintId: 128 });

    expect(res.status).toBe(400);
    expect(prisma.student.findFirst).not.toHaveBeenCalled();
  });

  it('retorna 404 para digital não vinculada', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(null);

    const res = await request(app).post('/api/access-logs/fingerprint').set('Authorization', authHeader()).send({ fingerprintId: 9 });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('FINGERPRINT_NOT_FOUND');
    expect(prisma.accessLog.create).not.toHaveBeenCalled();
  });

  it('registra entrada manual pelo RM', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(makeStudent() as never);
    prisma.accessLog.create.mockResolvedValue({ ...log, method: 'MANUAL' });

    const res = await request(app).post('/api/access-logs/manual').set('Authorization', authHeader()).send({ rm: '24001' });

    expect(res.status).toBe(201);
    expect(prisma.accessLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ method: 'MANUAL' }) }));
  });

  it('lista entradas paginadas e filtradas por período', async () => {
    const { app, prisma } = buildTestApp();
    prisma.accessLog.findMany.mockResolvedValue([log]);
    prisma.accessLog.count.mockResolvedValue(21);

    const res = await request(app)
      .get('/api/access-logs?page=2&pageSize=10&from=2026-03-01T00:00:00Z&to=2026-03-31T23:59:59Z')
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 21, page: 2, pageSize: 10 });
    const args = prisma.accessLog.findMany.mock.calls[0][0]!;
    expect(args.skip).toBe(10);
    expect(args.where!.createdAt).toEqual({ gte: new Date('2026-03-01T00:00:00Z'), lte: new Date('2026-03-31T23:59:59Z') });
  });

  it('exporta CSV', async () => {
    const { app, prisma } = buildTestApp();
    prisma.accessLog.findMany.mockResolvedValue([log, { ...log, id: 2, studentName: 'João "JJ"', method: 'MANUAL' }]);

    const res = await request(app).get('/api/access-logs/export').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Nome;Data/Hora (UTC);Método');
    expect(res.text).toContain('"João ""JJ""";2026-03-10T11:00:00.000Z;Manual');
  });

  it('neutraliza fórmulas no CSV exportado', async () => {
    const { app, prisma } = buildTestApp();
    prisma.accessLog.findMany.mockResolvedValue([{ ...log, studentName: '=HYPERLINK("http://x")' }]);

    const res = await request(app).get('/api/access-logs/export').set('Authorization', authHeader());

    expect(res.text).toContain(`"'=HYPERLINK(""http://x"")"`);
  });

  describe('todas as escolas (super admin)', () => {
    const withSchool = { ...log, school: { id: school.id, name: school.name } };

    it('super admin lista entradas de todas as escolas', async () => {
      const { app, prisma } = buildTestApp({ user: superAdmin });
      prisma.accessLog.findMany.mockResolvedValue([withSchool] as never);
      prisma.accessLog.count.mockResolvedValue(1);

      const res = await request(app).get('/api/access-logs').set('Authorization', authHeader()).set('X-School-Id', 'all');

      expect(res.status).toBe(200);
      const args = prisma.accessLog.findMany.mock.calls[0][0]!;
      expect(args.where).not.toHaveProperty('schoolId');
      expect(args.include).toEqual({ school: { select: { id: true, name: true } } });
      expect(res.body.items[0].school).toEqual({ id: school.id, name: school.name });
    });

    it('exportação de todas as escolas inclui coluna Escola', async () => {
      const { app, prisma } = buildTestApp({ user: superAdmin });
      prisma.accessLog.findMany.mockResolvedValue([withSchool] as never);

      const res = await request(app).get('/api/access-logs/export').set('Authorization', authHeader()).set('X-School-Id', 'all');

      expect(res.status).toBe(200);
      const lines = res.text.replace(/^\uFEFF/, '').split('\n');
      expect(lines[0]).toBe('Escola;Nome;Data/Hora (UTC);Método');
      expect(lines[1]).toBe(`"${school.name}";"Ana Souza";2026-03-10T11:00:00.000Z;Digital`);
    });

    it('stats de todas as escolas não filtram por escola', async () => {
      const { app, prisma } = buildTestApp({ user: superAdmin });
      prisma.student.count.mockResolvedValue(3);
      prisma.course.count.mockResolvedValue(2);
      prisma.accessLog.count.mockResolvedValue(1);
      prisma.accessLog.findMany.mockResolvedValue([withSchool] as never);

      const res = await request(app).get('/api/stats').set('Authorization', authHeader()).set('X-School-Id', 'all');

      expect(res.status).toBe(200);
      expect(prisma.student.count.mock.calls[0][0]?.where).toEqual({});
      expect(prisma.accessLog.findMany.mock.calls[0][0]?.where).toEqual({});
      expect(res.body.recentEntries[0].school.name).toBe(school.name);
    });

    it('stats trazem o curso do aluno nas últimas entradas (cartão do dia)', async () => {
      const { app, prisma } = buildTestApp();
      prisma.accessLog.findMany.mockResolvedValue([] as never);

      await request(app).get('/api/stats').set('Authorization', authHeader());

      expect(prisma.accessLog.findMany.mock.calls[0][0]?.include).toMatchObject({
        student: { select: { course: { select: { name: true } } } },
      });
    });
  });
});
