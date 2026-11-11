import request from 'supertest';
import { authHeader, buildTestApp, classGroup, school } from './helpers';

const subject = { id: 5, schoolId: school.id, name: 'Matemática', abbreviation: 'Mat.', color: '#ffd9a8', createdAt: new Date(), updatedAt: new Date() };
const teacher = { id: 8, schoolId: school.id, name: 'Ana Prado', contactEmail: null, createdAt: new Date(), updatedAt: new Date() };
const assignment = { id: 1, classGroupId: 20, subjectId: 5, teacherId: 8, createdAt: new Date(), updatedAt: new Date() };

describe('Professores por disciplina na turma', () => {
  it('define o professor da disciplina (cria ou troca)', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.subject.findFirst.mockResolvedValue(subject);
    prisma.teacher.findFirst.mockResolvedValue(teacher);
    prisma.teachingAssignment.upsert.mockResolvedValue(assignment);

    const res = await request(app)
      .put('/api/class-groups/20/assignments/5')
      .set('Authorization', authHeader())
      .send({ teacherId: 8 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      subject: { id: 5, name: 'Matemática', abbreviation: 'Mat.', color: '#ffd9a8' },
      teacher: { id: 8, name: 'Ana Prado' },
    });
    expect(prisma.teachingAssignment.upsert).toHaveBeenCalledWith({
      where: { classGroupId_subjectId: { classGroupId: 20, subjectId: 5 } },
      create: { classGroupId: 20, subjectId: 5, teacherId: 8 },
      update: { teacherId: 8 },
    });
  });

  it('recusa disciplina de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.subject.findFirst.mockResolvedValue(null);
    prisma.teacher.findFirst.mockResolvedValue(teacher);

    const res = await request(app)
      .put('/api/class-groups/20/assignments/5')
      .set('Authorization', authHeader())
      .send({ teacherId: 8 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_SUBJECT');
    expect(prisma.subject.findFirst).toHaveBeenCalledWith({ where: { id: 5, schoolId: school.id } });
    expect(prisma.teachingAssignment.upsert).not.toHaveBeenCalled();
  });

  it('recusa professor de outra escola', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.subject.findFirst.mockResolvedValue(subject);
    prisma.teacher.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/class-groups/20/assignments/5')
      .set('Authorization', authHeader())
      .send({ teacherId: 8 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_TEACHER');
    expect(prisma.teacher.findFirst).toHaveBeenCalledWith({ where: { id: 8, schoolId: school.id } });
  });

  it('não retira disciplina que está na grade vigente', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.teachingAssignment.findUnique.mockResolvedValue(assignment);
    prisma.timetableVersion.findFirst.mockResolvedValue({ id: 40, classGroupId: 20, validFrom: new Date(), createdAt: new Date() });
    prisma.timetableSlot.count.mockResolvedValue(2);

    const res = await request(app).delete('/api/class-groups/20/assignments/5').set('Authorization', authHeader());

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ASSIGNMENT_IN_USE');
    expect(prisma.timetableSlot.count).toHaveBeenCalledWith({ where: { versionId: 40, subjectId: 5 } });
    expect(prisma.teachingAssignment.delete).not.toHaveBeenCalled();
  });

  it('retira disciplina fora da grade', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.teachingAssignment.findUnique.mockResolvedValue(assignment);
    prisma.timetableVersion.findFirst.mockResolvedValue(null);

    const res = await request(app).delete('/api/class-groups/20/assignments/5').set('Authorization', authHeader());

    expect(res.status).toBe(204);
    expect(prisma.teachingAssignment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('retorna 404 ao retirar disciplina que não está na turma', async () => {
    const { app, prisma } = buildTestApp();
    prisma.classGroup.findFirst.mockResolvedValue(classGroup);
    prisma.teachingAssignment.findUnique.mockResolvedValue(null);
    const res = await request(app).delete('/api/class-groups/20/assignments/5').set('Authorization', authHeader());
    expect(res.status).toBe(404);
  });
});
