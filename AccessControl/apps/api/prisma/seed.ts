/**
 * Popula o banco com uma instituição de demonstração.
 * Uso: npm run prisma:seed (o e-mail e a senha podem ser trocados via SEED_EMAIL / SEED_PASSWORD).
 *
 * O login é feito pelo Supabase Auth. Com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY definidas,
 * o seed também cria o usuário (já confirmado) no Supabase. A instituição é vinculada a ele
 * pelo e-mail no primeiro login.
 */
import 'dotenv/config';
import { PrismaClient, SchoolYear } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const SCHOOL_NAME = 'ETEC Demonstração';

async function createAuthUser(email: string, password: string) {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log('SUPABASE_SERVICE_ROLE_KEY não definida: crie o usuário pela tela de cadastro com o mesmo e-mail.');
    return;
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: SCHOOL_NAME },
  });
  if (error && error.code !== 'email_exists') throw error;
  console.log(error ? 'Usuário já existia no Supabase Auth.' : 'Usuário criado no Supabase Auth.');
}

async function main() {
  const email = (process.env.SEED_EMAIL ?? 'demo@helpus.app').toLowerCase();
  const password = process.env.SEED_PASSWORD ?? 'helpus-demo-123';

  await createAuthUser(email, password);

  const school = await prisma.school.upsert({
    where: { email },
    update: {},
    create: { name: SCHOOL_NAME, email },
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

  // A senha não é exibida: é a de SEED_PASSWORD (ou a padrão documentada no README).
  console.log(`Seed concluído. Login: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
