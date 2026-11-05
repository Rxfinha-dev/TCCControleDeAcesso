import request from 'supertest';
import { authHeader, buildTestApp, makeStudent, school } from './helpers';

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
const course = { id: 3, name: 'DS', schoolId: school.id, createdAt: new Date(), updatedAt: new Date() };

describe('Alunos', () => {
  it('lista os alunos com filtro de busca', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findMany.mockResolvedValue([makeStudent()] as never);

    const res = await request(app).get('/api/students?search=ana').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ name: 'Ana Souza', hasPhoto: true, fingerprintEnrolled: false });
    expect(res.body[0]).not.toHaveProperty('photoKey');
    const where = prisma.student.findMany.mock.calls[0][0]!.where!;
    expect(where.schoolId).toBe(school.id);
    expect(where.OR).toHaveLength(2);
  });

  it('cadastra aluno com foto (multipart)', async () => {
    const { app, prisma, storage } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.findFirst.mockResolvedValue(null);
    prisma.student.create.mockResolvedValue(makeStudent({ photoKey: null }) as never);
    prisma.student.update.mockResolvedValue(makeStudent() as never);

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .field('year', 'FIRST')
      .field('courseId', '3')
      .attach('photo', PNG, { filename: 'ana.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(storage.photos.get('mem:10')?.mimeType).toBe('image/png');
    expect(prisma.student.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: 'Ana Souza', rm: '24001', age: 16, year: 'FIRST', courseId: 3, schoolId: school.id } }),
    );
  });

  it('exige foto no cadastro (como no sistema legado)', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .field('year', 'FIRST')
      .field('courseId', '3');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PHOTO_REQUIRED');
  });

  it('recusa arquivo que não é imagem', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .attach('photo', Buffer.from('oi'), { filename: 'a.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
  });

  it('recusa RM duplicado', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.findFirst.mockResolvedValue(makeStudent() as never);

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Outro')
      .field('rm', '24001')
      .field('age', '16')
      .field('year', 'FIRST')
      .field('courseId', '3')
      .attach('photo', PNG, { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Já existe um aluno com esse RM');
  });

  it('retorna a foto do aluno', async () => {
    const { app, prisma, storage } = buildTestApp();
    storage.photos.set('mem:10', { data: PNG, mimeType: 'image/png' });
    prisma.student.findFirst.mockResolvedValue(makeStudent() as never);

    const res = await request(app).get('/api/students/10/photo').set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  it('exclui aluno e a sua foto', async () => {
    const { app, prisma, storage } = buildTestApp();
    storage.photos.set('mem:10', { data: PNG, mimeType: 'image/png' });
    prisma.student.findFirst.mockResolvedValue(makeStudent() as never);

    const res = await request(app).delete('/api/students/10').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(storage.photos.size).toBe(0);
    expect(prisma.student.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  describe('Digital', () => {
    it('reserva a menor posição livre do sensor', async () => {
      const { app, prisma } = buildTestApp();
      prisma.student.findFirst.mockResolvedValue(makeStudent() as never);
      prisma.student.findMany.mockResolvedValue([{ fingerprintId: 1 }, { fingerprintId: 2 }, { fingerprintId: 4 }] as never);

      const res = await request(app).post('/api/students/10/fingerprint').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ fingerprintId: 3 });
      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { fingerprintId: 3, fingerprintEnrolledAt: null },
      });
    });

    it('reaproveita a posição já reservada do aluno', async () => {
      const { app, prisma } = buildTestApp();
      prisma.student.findFirst.mockResolvedValue(makeStudent({ fingerprintId: 7 }) as never);

      const res = await request(app).post('/api/students/10/fingerprint').set('Authorization', authHeader());

      expect(res.body).toEqual({ fingerprintId: 7 });
      expect(prisma.student.update).not.toHaveBeenCalled();
    });

    it('confirma o cadastro da digital', async () => {
      const { app, prisma } = buildTestApp();
      prisma.student.findFirst.mockResolvedValue(makeStudent({ fingerprintId: 7 }) as never);
      prisma.student.update.mockResolvedValue(makeStudent({ fingerprintId: 7, fingerprintEnrolledAt: new Date() }) as never);

      const res = await request(app).post('/api/students/10/fingerprint/confirm').set('Authorization', authHeader());

      expect(res.status).toBe(200);
      expect(res.body.fingerprintEnrolled).toBe(true);
    });
  });
});
