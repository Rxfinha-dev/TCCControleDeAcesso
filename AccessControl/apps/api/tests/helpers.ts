import type { PrismaClient, School, Student, User } from '@prisma/client';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import { createApp } from '../src/app';
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

export interface TestAppOptions {
  /** Usuário logado (padrão: o login SCHOOL da escola de teste). */
  user?: User;
}

export function buildTestApp({ user = schoolUser }: TestAppOptions = {}) {
  const prisma = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;
  // Executa as operações recebidas em $transaction([...]) como Promise.all.
  prisma.$transaction.mockImplementation(((operations: unknown) =>
    Array.isArray(operations) ? Promise.all(operations) : Promise.resolve(operations)) as never);
  // O middleware de autenticação busca o usuário logado (com a escola) a cada requisição.
  prisma.user.findUnique.mockResolvedValue({ ...user, school: user.schoolId === school.id ? school : null } as never);
  const identity = new FakeIdentity();
  const storage = new MemoryStorage();
  const app = createApp({ prisma, identity, storage });
  return { app, prisma, identity, storage };
}

export const school: School = {
  id: 1,
  name: 'ETEC Joaquim Ferreira do Amaral',
  email: 'etec@escola.com',
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

export function makeStudent(overrides: Partial<Student> = {}): Student & { course: { id: number; name: string } } {
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
