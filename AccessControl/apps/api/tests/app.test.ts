import request from 'supertest';
import { authHeader, buildTestApp } from './helpers';

describe('App', () => {
  it('GET /api/health informa status do banco', async () => {
    const { app, prisma } = buildTestApp();
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }] as never);

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
  });

  it('GET /api/health retorna 503 quando o banco está fora', async () => {
    const { app, prisma } = buildTestApp();
    prisma.$queryRaw.mockRejectedValue(new Error('down'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.database).toBe('down');
  });

  // Regressão: uma consulta que pendura (em vez de falhar) deixava a resposta sem
  // retorno, o health check nunca passava e o deploy no Render expirava em 15 min.
  // Usa timers reais: o supertest precisa deles para o socket HTTP.
  it(
    'GET /api/health retorna 503 quando a consulta ao banco pendura',
    async () => {
      const { app, prisma } = buildTestApp();
      prisma.$queryRaw.mockReturnValue(new Promise(() => {}) as never);

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body.database).toBe('down');
    },
    10_000,
  );

  it('responde 404 em JSON para rotas inexistentes', async () => {
    const { app } = buildTestApp();
    const res = await request(app).get('/api/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('GET /api/stats retorna o resumo do painel', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.count.mockResolvedValueOnce(12).mockResolvedValueOnce(3);
    prisma.course.count.mockResolvedValue(4);
    prisma.accessLog.count.mockResolvedValue(7);
    prisma.accessLog.findMany.mockResolvedValue([]);

    const res = await request(app).get('/api/stats').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ students: 12, courses: 4, entriesToday: 7, pendingFingerprints: 3, recentEntries: [] });
  });
});
