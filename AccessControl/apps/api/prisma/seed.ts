/**
 * Popula o banco com uma instituição de demonstração.
 * Uso: npm run prisma:seed (as credenciais podem ser trocadas via SEED_EMAIL / SEED_PASSWORD).
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient, SchoolYear } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_EMAIL ?? 'demo@helpus.app').toLowerCase();
  const password = process.env.SEED_PASSWORD ?? 'helpus-demo-123';

  const school = await prisma.school.upsert({
    where: { email },
    update: {},
    create: {
      name: 'ETEC Demonstração',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      emailVerifiedAt: new Date(),
    },
  });

  const courseNames = ['Desenvolvimento de Sistemas', 'Administração', 'Logística'];
  for (const name of courseNames) {
    await prisma.course.upsert({
      where: { schoolId_name: { schoolId: school.id, name } },
      update: {},
      create: { name, schoolId: school.id },
    });
  }

  const ds = await prisma.course.findFirstOrThrow({ where: { schoolId: school.id, name: courseNames[0] } });
  const students = [
    { name: 'Ana Souza', rm: '24001', age: 16, year: SchoolYear.FIRST },
    { name: 'Bruno Lima', rm: '24002', age: 17, year: SchoolYear.SECOND },
    { name: 'Carla Mendes', rm: '24003', age: 18, year: SchoolYear.THIRD },
  ];
  for (const student of students) {
    await prisma.student.upsert({
      where: { schoolId_rm: { schoolId: school.id, rm: student.rm } },
      update: {},
      create: { ...student, courseId: ds.id, schoolId: school.id },
    });
  }

  console.log(`Seed concluído. Login: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
