import type { PrismaClient, School, Student } from '@prisma/client';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import { createApp } from '../src/app';
import type { Mailer, MailMessage } from '../src/services/mailer';
import type { PhotoStorage, StoredPhoto } from '../src/services/storage';
import { signToken } from '../src/services/tokens';

export class FakeMailer implements Mailer {
  sent: MailMessage[] = [];
  async send(message: MailMessage) {
    this.sent.push(message);
  }
  /** Extrai o código de 6 dígitos do último e-mail enviado. */
  lastCode() {
    return this.sent.at(-1)?.text.match(/\d{6}/)?.[0];
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
  // O middleware de autenticação confere a instituição no banco a cada requisição.
  prisma.school.findUnique.mockResolvedValue(school);
  const mailer = new FakeMailer();
  const storage = new MemoryStorage();
  const app = createApp({ prisma, mailer, storage });
  return { app, prisma, mailer, storage };
}

export const school: School = {
  id: 1,
  name: 'ETEC Joaquim Ferreira do Amaral',
  email: 'etec@escola.com',
  passwordHash: '',
  emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
  sessionVersion: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

export const authHeader = (schoolId = school.id, ver = school.sessionVersion) =>
  `Bearer ${signToken({ sub: schoolId, name: school.name, email: school.email, ver })}`;

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
