import type { PrismaClient, School, Student } from '@prisma/client';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import { createApp } from '../src/app';
import type { AuthUser, IdentityProvider } from '../src/services/identity';
import type { PhotoStorage, StoredPhoto } from '../src/services/storage';

export const VALID_TOKEN = 'valid-token';
export const AUTH_USER_ID = '6f1c2b8e-3a4d-4e5f-9a0b-1c2d3e4f5a6b';

/** Simula o Supabase Auth: só o token VALID_TOKEN é aceito. */
export class FakeIdentity implements IdentityProvider {
  user: AuthUser = {
    userId: AUTH_USER_ID,
    email: 'etec@escola.com',
    name: 'ETEC Joaquim Ferreira do Amaral',
    emailConfirmed: true,
  };
  async verifyToken(token: string) {
    return token === VALID_TOKEN ? { userId: this.user.userId, email: this.user.email } : null;
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

export function buildTestApp() {
  const prisma = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;
  // Executa as operações recebidas em $transaction([...]) como Promise.all.
  prisma.$transaction.mockImplementation(((operations: unknown) =>
    Array.isArray(operations) ? Promise.all(operations) : Promise.resolve(operations)) as never);
  // O middleware de autenticação busca a instituição do usuário logado a cada requisição.
  prisma.school.findUnique.mockResolvedValue(school);
  const identity = new FakeIdentity();
  const storage = new MemoryStorage();
  const app = createApp({ prisma, identity, storage });
  return { app, prisma, identity, storage };
}

export const school: School = {
  id: 1,
  name: 'ETEC Joaquim Ferreira do Amaral',
  email: 'etec@escola.com',
  authUserId: AUTH_USER_ID,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
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
