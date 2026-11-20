/**
 * Popula o banco com uma escola de demonstração completa para teste de todas as funcionalidades:
 * - Escola com código ("etec-jau") e configurações de frequência
 * - Super admin e login da escola
 * - Cursos (Desenvolvimento de Sistemas, Administração, Logística)
 * - Disciplinas com cores e siglas
 * - Professores com cadastro e logins ("carlos.souza@etec-jau", "ana.prado@etec-jau", "mariana.silva@etec-jau")
 * - Turmas (2º DS A com grade completa, 1º DS A pronta para montar a grade no editor)
 * - Alunos com RMs e logins ("24001@etec-jau", "24002@etec-jau", "24003@etec-jau" com troca de senha)
 * - Alunos sem login para testar a ação "Gerar logins da turma"
 * - Matrículas e atribuição de professores às disciplinas
 * - Grade semanal completa com aulas e intervalos
 * - Calendário escolar com os 4 bimestres e recessos
 * - Entradas de catraca desde o início do ano letivo, com dois alunos faltosos (frequência perto e abaixo do mínimo)
 *
 * Só para desenvolvimento: recusa rodar com NODE_ENV=production. As senhas vêm de SEED_PASSWORD, SEED_ADMIN_PASSWORD,
 * SEED_TEACHER_PASSWORD e SEED_STUDENT_PASSWORD; sem elas, são sorteadas a cada execução e impressas no fim.
 *
 * Uso: npm run prisma:seed (a partir de apps/api ou npm run db:seed na raiz)
 */
import 'dotenv/config';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  PrismaClient,
  SchoolYear,
  Shift,
  TimetableSlotKind,
  UserRole,
  type Course,
  type Subject,
  type Teacher,
} from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { loginEmail } from '../src/lib/logins';

const prisma = new PrismaClient();

type SupabaseAdmin = ReturnType<typeof createClient>['auth']['admin'];

const SCHOOL_NAME = 'ETEC Demonstração';
const SCHOOL_EMAIL = (process.env.SEED_EMAIL ?? 'demo@helpus.app').toLowerCase();
const SCHOOL_CODE = 'etec-jau';
// Sem senha fixa no código: quem leu o repositório não pode entrar num banco populado por este seed.
const randomPassword = () => randomBytes(9).toString('base64url');
const SCHOOL_PASSWORD = process.env.SEED_PASSWORD || randomPassword();

const SUPER_ADMIN_EMAIL = 'admin@helpus.app';
const SUPER_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || randomPassword();
const TEACHER_PASSWORD = process.env.SEED_TEACHER_PASSWORD || randomPassword();
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || randomPassword();

interface AuthAccount {
  email: string;
  password: string;
  name: string;
}

/**
 * Cria (ou reaproveita) o usuário no Supabase Auth e devolve o id dele. Sem as chaves do Supabase,
 * devolve um id local: os dados servem para olhar as telas, mas ninguém consegue fazer login.
 * Com as chaves, qualquer falha interrompe o seed: um id inventado deixaria um login que nunca entra.
 */
async function syncSupabaseUser(supabaseAdmin: SupabaseAdmin | null, account: AuthAccount): Promise<string> {
  if (!supabaseAdmin) return randomUUID();

  const { data, error } = await supabaseAdmin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: { name: account.name },
  });
  if (!error) return data.user.id;
  if (error.code !== 'email_exists' && !error.message?.includes('already registered')) {
    throw new Error(`Supabase Auth recusou ${account.email}: ${error.message}`);
  }

  // Já existe: procura o id (página a página) e volta a senha para a do seed.
  for (let page = 1; ; page += 1) {
    const { data: list, error: listError } = await supabaseAdmin.listUsers({ page, perPage: 1000 });
    if (listError) throw new Error(`Supabase Auth não listou os usuários: ${listError.message}`);
    const existing = list.users.find((user) => user.email?.toLowerCase() === account.email.toLowerCase());
    if (existing) {
      await supabaseAdmin.updateUserById(existing.id, { password: account.password });
      return existing.id;
    }
    if (list.users.length < 1000) throw new Error(`Supabase Auth diz que ${account.email} existe, mas não o encontrou.`);
  }
}

async function main() {
  // Dado de demonstração (inclusive um super admin) não pertence à produção.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de demonstração não roda com NODE_ENV=production.');
  }
  console.log('--- Iniciando Seed do HelpUs Controle de Acesso ---');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let supabaseAdmin: SupabaseAdmin | null = null;

  if (supabaseUrl && serviceKey) {
    supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).auth.admin;
    console.log('Supabase Auth conectado: criando credenciais reais de autenticação.');
  } else {
    console.log('SUPABASE_SERVICE_ROLE_KEY não configurada: os dados são criados, mas NENHUM login vai funcionar.');
  }

  // 1. Escola
  console.log('1. Criando escola...');
  const school = await prisma.school.upsert({
    where: { email: SCHOOL_EMAIL },
    update: {
      name: SCHOOL_NAME,
      code: SCHOOL_CODE,
      minAttendance: 75,
      passingGrade: 6.0,
      gradeMax: 10,
    },
    create: {
      name: SCHOOL_NAME,
      email: SCHOOL_EMAIL,
      code: SCHOOL_CODE,
      minAttendance: 75,
      passingGrade: 6.0,
      gradeMax: 10,
    },
  });

  // 2. Usuário da Escola (SCHOOL)
  console.log('2. Criando usuário da escola e super admin...');
  const schoolAuthId = await syncSupabaseUser(supabaseAdmin, {
    email: SCHOOL_EMAIL,
    password: SCHOOL_PASSWORD,
    name: 'Diretoria ETEC',
  });

  await prisma.user.upsert({
    where: { email: SCHOOL_EMAIL },
    update: { schoolId: school.id, role: UserRole.SCHOOL, authUserId: schoolAuthId },
    create: {
      email: SCHOOL_EMAIL,
      name: 'Diretoria ETEC',
      role: UserRole.SCHOOL,
      schoolId: school.id,
      authUserId: schoolAuthId,
    },
  });

  // 3. Super Admin
  const adminAuthId = await syncSupabaseUser(supabaseAdmin, {
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    name: 'Administrador Global',
  });

  await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: { role: UserRole.SUPER_ADMIN, authUserId: adminAuthId },
    create: {
      email: SUPER_ADMIN_EMAIL,
      name: 'Administrador Global',
      role: UserRole.SUPER_ADMIN,
      authUserId: adminAuthId,
    },
  });

  // 4. Cursos
  console.log('3. Criando cursos técnicos...');
  const coursesData = [
    { name: 'Desenvolvimento de Sistemas' },
    { name: 'Administração' },
    { name: 'Logística' },
  ];

  const courses: Record<string, Course> = {};
  for (const c of coursesData) {
    const record = await prisma.course.upsert({
      where: { schoolId_name: { schoolId: school.id, name: c.name } },
      update: {},
      create: { name: c.name, schoolId: school.id },
    });
    courses[c.name] = record;
  }

  // 5. Disciplinas
  console.log('4. Criando disciplinas com cores e siglas...');
  const subjectsData = [
    { name: 'Matemática', abbreviation: 'MAT', color: '#2563EB' },
    { name: 'Língua Portuguesa', abbreviation: 'PORT', color: '#DC2626' },
    { name: 'Programação Web', abbreviation: 'PW', color: '#059669' },
    { name: 'Banco de Dados', abbreviation: 'BD', color: '#D97706' },
    { name: 'Redes de Computadores', abbreviation: 'REDES', color: '#7C3AED' },
    { name: 'Física', abbreviation: 'FIS', color: '#EA580C' },
    { name: 'Inglês Instrumental', abbreviation: 'ING', color: '#0891B2' },
  ];

  const subjects: Record<string, Subject> = {};
  for (const s of subjectsData) {
    const record = await prisma.subject.upsert({
      where: { schoolId_name: { schoolId: school.id, name: s.name } },
      update: { abbreviation: s.abbreviation, color: s.color },
      create: { ...s, schoolId: school.id },
    });
    subjects[s.name] = record;
  }

  // 6. Professores e seus Logins
  console.log('5. Criando professores e seus logins...');
  const teachersData = [
    {
      name: 'Carlos Alberto Souza',
      contactEmail: 'carlos.souza@escola.sp.gov.br',
      username: `carlos.souza@${SCHOOL_CODE}`,
      password: TEACHER_PASSWORD,
      mustChangePassword: false,
    },
    {
      name: 'Ana Paula Prado',
      contactEmail: 'ana.prado@escola.sp.gov.br',
      username: `ana.prado@${SCHOOL_CODE}`,
      password: TEACHER_PASSWORD,
      mustChangePassword: false,
    },
    {
      name: 'Mariana Costa Silva',
      contactEmail: 'mariana.silva@escola.sp.gov.br',
      username: `mariana.silva@${SCHOOL_CODE}`,
      password: TEACHER_PASSWORD,
      mustChangePassword: true, // Para testar a troca de senha obrigatória
    },
  ];

  const teachers: Record<string, Teacher> = {};
  for (const t of teachersData) {
    // Cadastro do professor
    let teacher = await prisma.teacher.findFirst({
      where: { schoolId: school.id, name: t.name },
    });
    if (!teacher) {
      teacher = await prisma.teacher.create({
        data: { name: t.name, contactEmail: t.contactEmail, schoolId: school.id },
      });
    }

    teachers[t.name] = teacher;

    // Login do professor
    const syntheticEmail = loginEmail(t.username);
    const authId = await syncSupabaseUser(supabaseAdmin, {
      email: syntheticEmail,
      password: t.password,
      name: t.name,
    });

    await prisma.user.upsert({
      where: { username: t.username },
      update: {
        teacherId: teacher.id,
        mustChangePassword: t.mustChangePassword,
        authUserId: authId,
      },
      create: {
        email: syntheticEmail,
        username: t.username,
        name: t.name,
        role: UserRole.TEACHER,
        schoolId: school.id,
        teacherId: teacher.id,
        mustChangePassword: t.mustChangePassword,
        authUserId: authId,
      },
    });
  }

  // 7. Turmas
  console.log('6. Criando turmas...');
  const CURRENT_YEAR = new Date().getFullYear();

  // 2º DS A (turma completa com grade)
  const class2DS = await prisma.classGroup.upsert({
    where: { schoolId_schoolYear_name: { schoolId: school.id, schoolYear: CURRENT_YEAR, name: '2º DS A' } },
    update: { shift: Shift.MORNING, courseId: courses['Desenvolvimento de Sistemas'].id },
    create: {
      name: '2º DS A',
      schoolYear: CURRENT_YEAR,
      shift: Shift.MORNING,
      courseId: courses['Desenvolvimento de Sistemas'].id,
      schoolId: school.id,
    },
  });

  // 1º DS A (turma pronta para testar montagem da grade)
  const class1DS = await prisma.classGroup.upsert({
    where: { schoolId_schoolYear_name: { schoolId: school.id, schoolYear: CURRENT_YEAR, name: '1º DS A' } },
    update: { shift: Shift.MORNING, courseId: courses['Desenvolvimento de Sistemas'].id },
    create: {
      name: '1º DS A',
      schoolYear: CURRENT_YEAR,
      shift: Shift.MORNING,
      courseId: courses['Desenvolvimento de Sistemas'].id,
      schoolId: school.id,
    },
  });

  // 1º ADM A (turno noturno)
  await prisma.classGroup.upsert({
    where: { schoolId_schoolYear_name: { schoolId: school.id, schoolYear: CURRENT_YEAR, name: '1º ADM A' } },
    update: { shift: Shift.EVENING, courseId: courses['Administração'].id },
    create: {
      name: '1º ADM A',
      schoolYear: CURRENT_YEAR,
      shift: Shift.EVENING,
      courseId: courses['Administração'].id,
      schoolId: school.id,
    },
  });

  // 8. Atribuição de Professores às Disciplinas
  console.log('7. Vinculando professores às disciplinas das turmas...');
  const assignments2DS = [
    { subject: subjects['Programação Web'], teacher: teachers['Carlos Alberto Souza'] },
    { subject: subjects['Banco de Dados'], teacher: teachers['Carlos Alberto Souza'] },
    { subject: subjects['Matemática'], teacher: teachers['Ana Paula Prado'] },
    { subject: subjects['Física'], teacher: teachers['Ana Paula Prado'] },
    { subject: subjects['Língua Portuguesa'], teacher: teachers['Mariana Costa Silva'] },
    { subject: subjects['Inglês Instrumental'], teacher: teachers['Mariana Costa Silva'] },
  ];

  for (const a of assignments2DS) {
    await prisma.teachingAssignment.upsert({
      where: { classGroupId_subjectId: { classGroupId: class2DS.id, subjectId: a.subject.id } },
      update: { teacherId: a.teacher.id },
      create: { classGroupId: class2DS.id, subjectId: a.subject.id, teacherId: a.teacher.id },
    });
  }

  const assignments1DS = [
    { subject: subjects['Matemática'], teacher: teachers['Ana Paula Prado'] },
    { subject: subjects['Língua Portuguesa'], teacher: teachers['Mariana Costa Silva'] },
    { subject: subjects['Programação Web'], teacher: teachers['Carlos Alberto Souza'] },
  ];

  for (const a of assignments1DS) {
    await prisma.teachingAssignment.upsert({
      where: { classGroupId_subjectId: { classGroupId: class1DS.id, subjectId: a.subject.id } },
      update: { teacherId: a.teacher.id },
      create: { classGroupId: class1DS.id, subjectId: a.subject.id, teacherId: a.teacher.id },
    });
  }

  // 9. Grade Semanal da Turma 2º DS A
  console.log('8. Criando grade semanal com horários e intervalos...');
  const timetableVersion = await prisma.timetableVersion.upsert({
    where: { classGroupId_validFrom: { classGroupId: class2DS.id, validFrom: new Date(`${CURRENT_YEAR}-02-01`) } },
    update: {},
    create: {
      classGroupId: class2DS.id,
      validFrom: new Date(`${CURRENT_YEAR}-02-01`),
    },
  });

  // Limpa slots antigos da versão para recriar de forma limpa
  await prisma.timetableSlot.deleteMany({ where: { versionId: timetableVersion.id } });

  // Horários das aulas (minutos a partir de 00:00)
  // 1: 07:30 - 08:20 (450 - 500)
  // 2: 08:20 - 09:10 (500 - 550)
  // Intervalo: 09:10 - 09:30 (550 - 570)
  // 3: 09:30 - 10:20 (570 - 620)
  // 4: 10:20 - 11:10 (620 - 670)
  // 5: 11:10 - 12:00 (670 - 720)
  const daysSlots = [
    // Segunda-feira (1)
    { weekday: 1, startMinute: 450, endMinute: 500, kind: TimetableSlotKind.LESSON, subjectId: subjects['Matemática'].id },
    { weekday: 1, startMinute: 500, endMinute: 550, kind: TimetableSlotKind.LESSON, subjectId: subjects['Matemática'].id },
    { weekday: 1, startMinute: 550, endMinute: 570, kind: TimetableSlotKind.BREAK, subjectId: null },
    { weekday: 1, startMinute: 570, endMinute: 620, kind: TimetableSlotKind.LESSON, subjectId: subjects['Programação Web'].id },
    { weekday: 1, startMinute: 620, endMinute: 670, kind: TimetableSlotKind.LESSON, subjectId: subjects['Programação Web'].id },
    { weekday: 1, startMinute: 670, endMinute: 720, kind: TimetableSlotKind.LESSON, subjectId: subjects['Física'].id },

    // Terça-feira (2)
    { weekday: 2, startMinute: 450, endMinute: 500, kind: TimetableSlotKind.LESSON, subjectId: subjects['Banco de Dados'].id },
    { weekday: 2, startMinute: 500, endMinute: 550, kind: TimetableSlotKind.LESSON, subjectId: subjects['Banco de Dados'].id },
    { weekday: 2, startMinute: 550, endMinute: 570, kind: TimetableSlotKind.BREAK, subjectId: null },
    { weekday: 2, startMinute: 570, endMinute: 620, kind: TimetableSlotKind.LESSON, subjectId: subjects['Língua Portuguesa'].id },
    { weekday: 2, startMinute: 620, endMinute: 670, kind: TimetableSlotKind.LESSON, subjectId: subjects['Língua Portuguesa'].id },
    { weekday: 2, startMinute: 670, endMinute: 720, kind: TimetableSlotKind.LESSON, subjectId: subjects['Matemática'].id },

    // Quarta-feira (3)
    { weekday: 3, startMinute: 450, endMinute: 500, kind: TimetableSlotKind.LESSON, subjectId: subjects['Programação Web'].id },
    { weekday: 3, startMinute: 500, endMinute: 550, kind: TimetableSlotKind.LESSON, subjectId: subjects['Programação Web'].id },
    { weekday: 3, startMinute: 550, endMinute: 570, kind: TimetableSlotKind.BREAK, subjectId: null },
    { weekday: 3, startMinute: 570, endMinute: 620, kind: TimetableSlotKind.LESSON, subjectId: subjects['Banco de Dados'].id },
    { weekday: 3, startMinute: 620, endMinute: 670, kind: TimetableSlotKind.LESSON, subjectId: subjects['Física'].id },
    { weekday: 3, startMinute: 670, endMinute: 720, kind: TimetableSlotKind.LESSON, subjectId: subjects['Física'].id },

    // Quinta-feira (4)
    { weekday: 4, startMinute: 450, endMinute: 500, kind: TimetableSlotKind.LESSON, subjectId: subjects['Língua Portuguesa'].id },
    { weekday: 4, startMinute: 500, endMinute: 550, kind: TimetableSlotKind.LESSON, subjectId: subjects['Língua Portuguesa'].id },
    { weekday: 4, startMinute: 550, endMinute: 570, kind: TimetableSlotKind.BREAK, subjectId: null },
    { weekday: 4, startMinute: 570, endMinute: 620, kind: TimetableSlotKind.LESSON, subjectId: subjects['Matemática'].id },
    { weekday: 4, startMinute: 620, endMinute: 670, kind: TimetableSlotKind.LESSON, subjectId: subjects['Programação Web'].id },
    { weekday: 4, startMinute: 670, endMinute: 720, kind: TimetableSlotKind.LESSON, subjectId: subjects['Programação Web'].id },

    // Sexta-feira (5)
    { weekday: 5, startMinute: 450, endMinute: 500, kind: TimetableSlotKind.LESSON, subjectId: subjects['Banco de Dados'].id },
    { weekday: 5, startMinute: 500, endMinute: 550, kind: TimetableSlotKind.LESSON, subjectId: subjects['Banco de Dados'].id },
    { weekday: 5, startMinute: 550, endMinute: 570, kind: TimetableSlotKind.BREAK, subjectId: null },
    { weekday: 5, startMinute: 570, endMinute: 620, kind: TimetableSlotKind.LESSON, subjectId: subjects['Matemática'].id },
    { weekday: 5, startMinute: 620, endMinute: 670, kind: TimetableSlotKind.LESSON, subjectId: subjects['Língua Portuguesa'].id },
    { weekday: 5, startMinute: 670, endMinute: 720, kind: TimetableSlotKind.LESSON, subjectId: subjects['Inglês Instrumental'].id },
  ];

  await prisma.timetableSlot.createMany({
    data: daysSlots.map((slot) => ({ ...slot, versionId: timetableVersion.id })),
  });

  // 10. Alunos e Matrículas
  console.log('9. Criando alunos e matrículas...');
  const students2DSData = [
    { name: 'Lucas Oliveira Santos', rm: '24001', age: 16, year: SchoolYear.SECOND, hasLogin: true, mustChangePassword: false },
    { name: 'Beatriz Fernandes Lima', rm: '24002', age: 16, year: SchoolYear.SECOND, hasLogin: true, mustChangePassword: false },
    { name: 'Gabriel Souza Ribeiro', rm: '24003', age: 17, year: SchoolYear.SECOND, hasLogin: true, mustChangePassword: true },
    { name: 'Juliana Martins Rocha', rm: '24004', age: 16, year: SchoolYear.SECOND, hasLogin: true, mustChangePassword: false },
    { name: 'Thiago Alves Pereira', rm: '24005', age: 16, year: SchoolYear.SECOND, hasLogin: false, mustChangePassword: false },
  ];

  /** RM -> id, para as leituras da catraca no fim. */
  const studentIds: Record<string, number> = {};

  for (const s of students2DSData) {
    const student = await prisma.student.upsert({
      where: { schoolId_rm: { schoolId: school.id, rm: s.rm } },
      update: { name: s.name, age: s.age, year: s.year, courseId: courses['Desenvolvimento de Sistemas'].id },
      create: {
        name: s.name,
        rm: s.rm,
        age: s.age,
        year: s.year,
        courseId: courses['Desenvolvimento de Sistemas'].id,
        schoolId: school.id,
      },
    });

    studentIds[s.rm] = student.id;

    // Matrícula na turma 2º DS A
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, classGroupId: class2DS.id, schoolYear: CURRENT_YEAR },
    });
    if (!enrollment) {
      await prisma.enrollment.create({
        data: {
          classGroupId: class2DS.id,
          studentId: student.id,
          schoolYear: CURRENT_YEAR,
          startDate: new Date(`${CURRENT_YEAR}-02-01`),
        },
      });
    }

    // Login do aluno
    if (s.hasLogin) {
      const username = `${s.rm}@${SCHOOL_CODE}`;
      const syntheticEmail = loginEmail(username);
      const authId = await syncSupabaseUser(supabaseAdmin, {
        email: syntheticEmail,
        password: STUDENT_PASSWORD,
        name: s.name,
      });

      await prisma.user.upsert({
        where: { username },
        update: { studentId: student.id, mustChangePassword: s.mustChangePassword, authUserId: authId },
        create: {
          email: syntheticEmail,
          username,
          name: s.name,
          role: UserRole.STUDENT,
          schoolId: school.id,
          studentId: student.id,
          mustChangePassword: s.mustChangePassword,
          authUserId: authId,
        },
      });
    }
  }

  // Alunos da turma 1º DS A
  const students1DSData = [
    { name: 'Camila Duarte Nogueira', rm: '25001', age: 15, year: SchoolYear.FIRST, hasLogin: true, mustChangePassword: false },
    { name: 'Felipe Mendes Castro', rm: '25002', age: 15, year: SchoolYear.FIRST, hasLogin: false, mustChangePassword: false },
    { name: 'Larissa Castro Barbosa', rm: '25003', age: 15, year: SchoolYear.FIRST, hasLogin: false, mustChangePassword: false },
  ];

  for (const s of students1DSData) {
    const student = await prisma.student.upsert({
      where: { schoolId_rm: { schoolId: school.id, rm: s.rm } },
      update: { name: s.name, age: s.age, year: s.year, courseId: courses['Desenvolvimento de Sistemas'].id },
      create: {
        name: s.name,
        rm: s.rm,
        age: s.age,
        year: s.year,
        courseId: courses['Desenvolvimento de Sistemas'].id,
        schoolId: school.id,
      },
    });

    studentIds[s.rm] = student.id;

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, classGroupId: class1DS.id, schoolYear: CURRENT_YEAR },
    });
    if (!enrollment) {
      await prisma.enrollment.create({
        data: {
          classGroupId: class1DS.id,
          studentId: student.id,
          schoolYear: CURRENT_YEAR,
          startDate: new Date(`${CURRENT_YEAR}-02-01`),
        },
      });
    }

    if (s.hasLogin) {
      const username = `${s.rm}@${SCHOOL_CODE}`;
      const syntheticEmail = loginEmail(username);
      const authId = await syncSupabaseUser(supabaseAdmin, {
        email: syntheticEmail,
        password: STUDENT_PASSWORD,
        name: s.name,
      });

      await prisma.user.upsert({
        where: { username },
        update: { studentId: student.id, mustChangePassword: s.mustChangePassword, authUserId: authId },
        create: {
          email: syntheticEmail,
          username,
          name: s.name,
          role: UserRole.STUDENT,
          schoolId: school.id,
          studentId: student.id,
          mustChangePassword: s.mustChangePassword,
          authUserId: authId,
        },
      });
    }
  }

  // 11. Calendário Escolar (Bimestres e Dias sem aula)
  console.log('10. Configurando calendário e bimestres...');
  const termsData = [
    { number: 1, startDate: new Date(`${CURRENT_YEAR}-02-02`), endDate: new Date(`${CURRENT_YEAR}-04-17`) },
    { number: 2, startDate: new Date(`${CURRENT_YEAR}-04-22`), endDate: new Date(`${CURRENT_YEAR}-07-03`) },
    { number: 3, startDate: new Date(`${CURRENT_YEAR}-07-27`), endDate: new Date(`${CURRENT_YEAR}-10-02`) },
    { number: 4, startDate: new Date(`${CURRENT_YEAR}-10-05`), endDate: new Date(`${CURRENT_YEAR}-12-18`) },
  ];

  for (const term of termsData) {
    await prisma.schoolTerm.upsert({
      where: { schoolId_schoolYear_number: { schoolId: school.id, schoolYear: CURRENT_YEAR, number: term.number } },
      update: { startDate: term.startDate, endDate: term.endDate },
      create: { schoolId: school.id, schoolYear: CURRENT_YEAR, ...term },
    });
  }

  // Dias sem aula
  const noClassDays = [
    { name: 'Recesso de Carnaval', startDate: new Date(`${CURRENT_YEAR}-02-16`), endDate: new Date(`${CURRENT_YEAR}-02-18`) },
    { name: 'Férias de Julho', startDate: new Date(`${CURRENT_YEAR}-07-06`), endDate: new Date(`${CURRENT_YEAR}-07-24`) },
    { name: 'Semana de Planejamento', startDate: new Date(`${CURRENT_YEAR}-10-12`), endDate: new Date(`${CURRENT_YEAR}-10-16`) },
  ];

  for (const day of noClassDays) {
    const existing = await prisma.noClassDay.findFirst({
      where: { schoolId: school.id, name: day.name, startDate: day.startDate },
    });
    if (!existing) {
      await prisma.noClassDay.create({ data: { schoolId: school.id, ...day } });
    }
  }

  // 12. Entradas de Catraca: uma leitura de entrada por aluno em cada dia útil desde o início do ano letivo.
  // A presença é calculada do ano inteiro; só com as leituras de hoje, todo mundo apareceria com frequência perto de 0%.
  console.log('11. Criando registros de entrada na catraca...');
  // Faltosos de propósito, para a demonstração mostrar os alertas: dias da semana (1 = segunda) em que não vêm.
  const absentWeekdays: Record<string, number[]> = { '24005': [1], '24003': [1, 5] };
  const names = new Map([...students2DSData, ...students1DSData].map((student) => [student.rm, student.name]));
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  const entries = [];
  for (
    let day = new Date(`${CURRENT_YEAR}-02-02T12:00:00Z`);
    day.toISOString().slice(0, 10) <= todayIso;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    const iso = day.toISOString().slice(0, 10);
    for (const [index, [rm, studentId]] of Object.entries(studentIds).entries()) {
      if (absentWeekdays[rm]?.includes(weekday)) continue;
      entries.push({
        schoolId: school.id,
        studentId,
        studentName: names.get(rm) ?? rm,
        // Horário de São Paulo (UTC-3), alguns minutos antes da primeira aula (07:30).
        createdAt: new Date(`${iso}T07:${String(15 + index).padStart(2, '0')}:00-03:00`),
      });
    }
  }
  // Rodar o seed de novo não duplica: as leituras da escola de demonstração são recriadas.
  await prisma.accessLog.deleteMany({ where: { schoolId: school.id } });
  await prisma.accessLog.createMany({ data: entries });

  console.log(`
==================================================================
           SEED CONCLUÍDO COM SUCESSO!
==================================================================

1. ADMINISTRAÇÃO DA ESCOLA (Secretaria / Gestão)
   - Login: ${SCHOOL_EMAIL}
   - Senha: ${SCHOOL_PASSWORD}
   - Código da Escola: ${SCHOOL_CODE}
   - Acesso: Cursos, Turmas, Disciplinas, Professores, Grade, Alunos, Calendário, Chamada

2. SUPER ADMIN (Gestão Global)
   - Login: ${SUPER_ADMIN_EMAIL}
   - Senha: ${SUPER_ADMIN_PASSWORD}
   - Acesso: Gestão de escolas e todos os usuários do sistema

${supabaseAdmin ? '' : 'ATENÇÃO: sem SUPABASE_SERVICE_ROLE_KEY, nenhum dos logins desta lista funciona.\n\n'}3. PROFESSORES
   - Prof. Carlos Alberto Souza (Web / BD):
     * Usuário: carlos.souza@${SCHOOL_CODE}
     * Senha:   ${TEACHER_PASSWORD}
   - Profa. Ana Paula Prado (Matemática / Física):
     * Usuário: ana.prado@${SCHOOL_CODE}
     * Senha:   ${TEACHER_PASSWORD}
   - Profa. Mariana Costa Silva (Português / Inglês) [Primeiro Acesso]:
     * Usuário: mariana.silva@${SCHOOL_CODE}
     * Senha:   ${TEACHER_PASSWORD} (Pedirá nova senha na tela "Crie sua senha")

4. ALUNOS
   - Lucas Oliveira Santos:
     * Usuário: 24001@${SCHOOL_CODE}
     * Senha:   ${STUDENT_PASSWORD}
   - Beatriz Fernandes Lima:
     * Usuário: 24002@${SCHOOL_CODE}
     * Senha:   ${STUDENT_PASSWORD}
   - Gabriel Souza Ribeiro [Primeiro Acesso]:
     * Usuário: 24003@${SCHOOL_CODE}
     * Senha:   ${STUDENT_PASSWORD} (Pedirá nova senha na tela "Crie sua senha")
   - Thiago Alves Pereira (RM 24005):
     * SEM LOGIN ainda! Use a secretaria para testar "Gerar logins da turma".
     * Falta toda segunda (frequência perto do mínimo); o Gabriel falta segunda e sexta (abaixo do mínimo).

5. TURMAS PARA TESTE
   - "2º DS A": Grade semanal 100% montada (com aulas e intervalos)
   - "1º DS A": Sem grade semanal -> Acesse e teste o editor arrastando disciplinas!
==================================================================
`);
}

main()
  .catch((error) => {
    console.error('Erro durante a execução do seed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
