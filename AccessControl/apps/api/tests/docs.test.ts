import request from 'supertest';
import { openApiSpec } from '../src/docs/openapi';
import { buildTestApp } from './helpers';

describe('Documentação da API', () => {
  it('GET /docs.json devolve a especificação OpenAPI sem exigir login', async () => {
    const { app } = buildTestApp();

    const res = await request(app).get('/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/health',
        '/api/auth/me',
        '/api/courses',
        '/api/courses/{id}',
        '/api/students',
        '/api/students/{id}',
        '/api/students/{id}/photo',
        '/api/students/{id}/fingerprint',
        '/api/students/{id}/fingerprint/confirm',
        '/api/access-logs',
        '/api/access-logs/export',
        '/api/access-logs/fingerprint',
        '/api/access-logs/manual',
        '/api/stats',
        '/api/schools',
        '/api/schools/{id}',
        '/api/users',
        '/api/users/{id}',
        '/api/subjects',
        '/api/subjects/{id}',
        '/api/teachers',
        '/api/teachers/{id}',
        '/api/class-groups',
        '/api/class-groups/{id}',
        '/api/class-groups/copy',
        '/api/class-groups/{id}/students',
        '/api/class-groups/{id}/students/{studentId}',
        '/api/class-groups/{id}/assignments/{subjectId}',
        '/api/class-groups/{id}/timetable',
        '/api/calendar',
        '/api/attendance/day',
        '/api/attendance/summary',
        '/api/attendance/override',
        '/api/attendance/cancellation',
        '/api/settings',
        '/api/calendar/holidays/{date}',
        '/api/calendar/no-class-days',
        '/api/calendar/no-class-days/{id}',
        '/api/calendar/terms/{schoolYear}',
      ]),
    );
  });

  it('GET /docs/ exibe o Swagger UI', async () => {
    const { app } = buildTestApp();

    const res = await request(app).get('/docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
  });

  it('todas as referências da especificação apontam para schemas existentes', () => {
    const refs = JSON.stringify(openApiSpec).match(/#\/components\/schemas\/\w+/g) ?? [];
    const schemas = Object.keys(openApiSpec.components.schemas);

    for (const ref of new Set(refs)) {
      expect(schemas).toContain(ref.split('/').pop());
    }
  });
});
