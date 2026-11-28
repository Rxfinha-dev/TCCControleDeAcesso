import request from 'supertest';
import { matchesSignature } from '../src/middlewares/upload';
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

  it('cadastra aluno sem curso e sem série (escola de ensino regular)', async () => {
    const { app, prisma } = buildTestApp();
    prisma.student.findFirst.mockResolvedValue(null);
    prisma.student.create.mockResolvedValue(makeStudent({ photoKey: null, courseId: null, year: null }) as never);
    prisma.student.update.mockResolvedValue(makeStudent({ courseId: null, year: null }) as never);

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .field('year', '')
      .attach('photo', PNG, { filename: 'ana.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(prisma.course.findFirst).not.toHaveBeenCalled();
    expect(prisma.student.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ courseId: null, year: null }) }),
    );
  });

  it('recusa curso de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .field('courseId', '99')
      .attach('photo', PNG, { filename: 'ana.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_COURSE');
    expect(prisma.course.findFirst).toHaveBeenCalledWith({ where: { id: 99, schoolId: school.id } });
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

  it('curso acima do limite de INT4 é 400, não erro do banco', async () => {
    const { app, prisma } = buildTestApp();

    const list = await request(app).get('/api/students?courseId=99999999999').set('Authorization', authHeader());
    const create = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .field('courseId', '2147483648');

    expect(list.status).toBe(400);
    expect(create.status).toBe(400);
    expect(prisma.student.findMany).not.toHaveBeenCalled();
    expect(prisma.student.create).not.toHaveBeenCalled();
  });

  it('mensagens de validação saem em português', async () => {
    const { app } = buildTestApp();

    const res = await request(app).get('/api/students?search=' + 'a'.repeat(101)).set('Authorization', authHeader());

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/^Demasiado grande/);
  });

  it('recusa formulário com campos demais (multipart)', async () => {
    const { app, prisma } = buildTestApp();
    let req = request(app).post('/api/students').set('Authorization', authHeader());
    for (let index = 0; index < 30; index += 1) req = req.field(`extra${index}`, 'x');

    const res = await req;

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UPLOAD_ERROR');
    expect(prisma.student.create).not.toHaveBeenCalled();
  });

  it('recusa campo de texto grande demais no multipart', async () => {
    const { app } = buildTestApp();
    const res = await request(app).post('/api/students').set('Authorization', authHeader()).field('name', 'a'.repeat(10_000));
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UPLOAD_ERROR');
  });

  it('recusa arquivo declarado como imagem cujo conteúdo não é imagem', async () => {
    const { app, prisma, storage } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .attach('photo', Buffer.from('<html><script>alert(1)</script></html>'), { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PHOTO');
    expect(prisma.student.create).not.toHaveBeenCalled();
    expect(storage.photos.size).toBe(0);
  });

  it('recusa JPEG declarado como PNG (o tipo servido depois seria errado)', async () => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .attach('photo', Buffer.from('ffd8ffe000104a464946', 'hex'), { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PHOTO');
  });

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])('recusa tipo "%s" sem lançar erro', async (contentType) => {
    const { app } = buildTestApp();
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .attach('photo', PNG, { filename: 'a.png', contentType });
    expect(res.status).toBe(400);
  });

  it('matchesSignature rejeita tipos desconhecidos ou de protótipo', () => {
    for (const tipo of ['constructor', '__proto__', 'toString', 'text/plain', '']) {
      expect(matchesSignature(tipo, PNG)).toBe(false);
    }
    expect(matchesSignature('image/png', PNG)).toBe(true);
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

  it('RM repetido com outra caixa também é duplicado', async () => {
    const { app, prisma } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.findFirst.mockResolvedValue(makeStudent({ rm: 'AB12' }) as never);

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Outro')
      .field('rm', 'ab12')
      .field('age', '16')
      .field('courseId', '3')
      .attach('photo', PNG, { filename: 'a.png', contentType: 'image/png' });

    expect(res.status).toBe(409);
    expect(prisma.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ rm: { equals: 'ab12', mode: 'insensitive' } }) }),
    );
  });

  it('se a foto não for salva, o aluno não fica cadastrado pela metade', async () => {
    const { app, prisma, storage } = buildTestApp();
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.findFirst.mockResolvedValue(null);
    prisma.student.create.mockResolvedValue(makeStudent({ photoKey: null }) as never);
    jest.spyOn(storage, 'save').mockRejectedValue(new Error('storage fora do ar'));

    const res = await request(app)
      .post('/api/students')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .field('courseId', '3')
      .attach('photo', PNG, { filename: 'ana.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(prisma.student.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it('trocar a foto mantém a antiga se o cadastro não for salvo', async () => {
    const { app, prisma, storage } = buildTestApp();
    storage.photos.set('antiga', { buffer: PNG, mimeType: 'image/png' } as never);
    prisma.course.findFirst.mockResolvedValue(course);
    prisma.student.findFirst.mockResolvedValueOnce(makeStudent({ photoKey: 'antiga' }) as never).mockResolvedValueOnce(null);
    prisma.student.update.mockRejectedValue(new Error('banco fora do ar'));

    const res = await request(app)
      .put('/api/students/10')
      .set('Authorization', authHeader())
      .field('name', 'Ana Souza')
      .field('rm', '24001')
      .field('age', '16')
      .field('courseId', '3')
      .attach('photo', PNG, { filename: 'ana.png', contentType: 'image/png' });

    expect(res.status).toBe(500);
    expect(storage.photos.has('antiga')).toBe(true);
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
