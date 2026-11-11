import type { ClassGroup, PrismaClient, School, Student, User } from '@prisma/client';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import { createApp } from '../src/app';
import type { Holiday, HolidayProvider } from '../src/services/holidays';
import type { AuthUser, IdentityProvider } from '../src/services/identity';
import type { PhotoStorage, StoredPhoto } from '../src/services/storage';

export const VALID_TOKEN = 'valid-token';
export const AUTH_USER_ID = '6f1c2b8e-3a4d-4e5f-9a0b-1c2d3e4f5a6b';
export const SESSION_ID = '0b9c8d7e-6f5a-4b3c-8d2e-1f0a9b8c7d6e';

/** Simula o Supabase Auth: só o token VALID_TOKEN é aceito. */
export class FakeIdentity implements IdentityProvider {
  user: AuthUser = {
    userId: AUTH_USER_ID,
    email: 'etec@escola.com',
    name: 'ETEC Joaquim Ferreira do Amaral',
    emailConfirmed: true,
  };
  /** Sessões encerradas (logout ou troca de senha). */
  revokedSessions = new Set<string>();
  async verifyToken(token: string) {
    return token === VALID_TOKEN ? { userId: this.user.userId, email: this.user.email, sessionId: SESSION_ID } : null;
  }
  async isSessionActive(_token: string, sessionId: string) {
    return !this.revokedSessions.has(sessionId);
  }
  async getUser(token: string) {
    return token === VALID_TOKEN ? this.user : null;
  }
  /** Logins criados (e-mail -> senha) e senhas trocadas (id -> senha). */
  created = new Map<string, string>();
  passwords = new Map<string, string>();
  deleted: string[] = [];
  /** E-mails cuja criação falha (simula erro do Supabase). */
  failEmails = new Set<string>();
  async createUser(email: string, password: string) {
    if (this.failEmails.has(email)) throw new Error('Supabase recusou');
    this.created.set(email, password);
    return `auth-${email}`;
  }
  async setPassword(authUserId: string, password: string) {
    this.passwords.set(authUserId, password);
  }
  async deleteUser(authUserId: string) {
    this.deleted.push(authUserId);
  }
}

export class MemoryStorage implements PhotoStorage {
  photos = new Map<string, StoredPhoto>();
  async save(studentId: number, _schoolId: number, photo: StoredPhoto) {
    const key = `mem:${studentId}`;
    this.photos.set(key, photo);
    return key;
  }
  async get(_studentId: number, key: string) {
    return this.photos.get(key) ?? null;
  }
  async remove(_studentId: number, key: string) {
    this.photos.delete(key);
  }
}

/** Simula a BrasilAPI: devolve os feriados configurados por ano, ou falha. */
export class FakeHolidays implements HolidayProvider {
  byYear: Record<number, Holiday[]> = {};
  fail = false;
  calls: number[] = [];
  async fetch(year: number) {
    this.calls.push(year);
    if (this.fail) throw new Error('BrasilAPI fora do ar');
    return this.byYear[year] ?? [];
  }
}

export interface TestAppOptions {
  /** Usuário logado (padrão: o login SCHOOL da escola de teste). */
  user?: User;
}

export function buildTestApp({ user = schoolUser }: TestAppOptions = {}) {
  const prisma = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;
  // Executa as operações recebidas em $transaction([...]) como Promise.all.
  // Transações interativas recebem o próprio mock como cliente da transação.
  prisma.$transaction.mockImplementation(((operations: unknown) =>
    Array.isArray(operations)
      ? Promise.all(operations)
      : typeof operations === 'function'
        ? operations(prisma)
        : Promise.resolve(operations)) as never);
  // O middleware de autenticação busca o usuário logado (com a escola) a cada requisição.
  prisma.user.findUnique.mockResolvedValue({ ...user, school: user.schoolId === school.id ? school : null } as never);
  const identity = new FakeIdentity();
  const storage = new MemoryStorage();
  const holidays = new FakeHolidays();
  const app = createApp({ prisma, identity, storage, holidays });
  return { app, prisma, identity, storage, holidays };
}

export const school: School = {
  id: 1,
  name: 'ETEC Joaquim Ferreira do Amaral',
  email: 'etec@escola.com',
  code: 'etec-jau',
  minAttendance: 75,
  gradingKind: 'NUMERIC',
  gradeMax: 10,
  gradeDecimals: 1,
  passingGrade: 6,
  gradeConcepts: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

/** Login compartilhado da escola de teste (secretaria, guarda etc.). */
export const schoolUser: User = {
  id: 1,
  authUserId: AUTH_USER_ID,
  email: 'etec@escola.com',
  name: 'ETEC Joaquim Ferreira do Amaral',
  role: 'SCHOOL',
  schoolId: 1,
  username: null,
  mustChangePassword: false,
  teacherId: null,
  studentId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

/** Super admin cuja escola padrão é a escola de teste. */
export const superAdmin: User = {
  ...schoolUser,
  id: 2,
  email: 'rafaelhenriqueoliveira1234@gmail.com',
  name: 'Rafael',
  role: 'SUPER_ADMIN',
};

export const authHeader = () => `Bearer ${VALID_TOKEN}`;

export function makeStudent(overrides: Partial<Student> = {}): Student & { course: { id: number; name: string } | null } {
  return {
    id: 10,
    name: 'Ana Souza',
    rm: '24001',
    age: 16,
    year: 'FIRST',
    courseId: 3,
    schoolId: school.id,
    photoKey: 'mem:10',
    fingerprintId: null,
    fingerprintEnrolledAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    course: { id: 3, name: 'Desenvolvimento de Sistemas' },
    ...overrides,
  };
}

/** Turma da escola de teste. */
export const classGroup: ClassGroup = {
  id: 20,
  schoolId: school.id,
  name: '2º DS A',
  schoolYear: 2026,
  shift: 'MORNING',
  courseId: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
};
