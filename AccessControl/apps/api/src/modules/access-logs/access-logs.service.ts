import { AccessMethod, type Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { notFound } from '../../lib/errors';
import { toStudentDto } from '../students/students.service';

export const listAccessLogsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const fingerprintEntrySchema = z.object({
  fingerprintId: z.coerce.number().int().min(1).max(1000),
});

export const manualEntrySchema = z.object({
  rm: z.string().trim().min(1, 'Informe o RM').max(8),
});

export type ListAccessLogsQuery = z.infer<typeof listAccessLogsQuerySchema>;

const EXPORT_LIMIT = 10_000;

/** Escola de cada entrada (usada no modo "todas as escolas"). */
export const accessLogSchoolInclude = { school: { select: { id: true, name: true } } } as const;

export class AccessLogsService {
  constructor(private readonly prisma: PrismaClient) {}

  /** schoolId null = todas as escolas (super admin). */
  async list(schoolId: number | null, query: ListAccessLogsQuery) {
    const where = this.buildWhere(schoolId, query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.accessLog.findMany({
        where,
        include: accessLogSchoolInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.accessLog.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  /** schoolId null = todas as escolas, com a coluna "Escola" no início. */
  async exportCsv(schoolId: number | null, query: ListAccessLogsQuery) {
    const allSchools = schoolId === null;
    const logs = await this.prisma.accessLog.findMany({
      where: this.buildWhere(schoolId, query),
      include: accessLogSchoolInclude,
      orderBy: { createdAt: 'desc' },
      take: EXPORT_LIMIT,
    });
    // Prefixa com ' valores que o Excel interpretaria como fórmula (=, +, -, @, tab, CR).
    const escape = (value: string) => `"${value.replace(/^[=+\-@\t\r]/, "'$&").replace(/"/g, '""')}"`;
    const lines = logs.map((log) => {
      const columns = [
        escape(log.studentName),
        log.createdAt.toISOString(),
        log.method === AccessMethod.FINGERPRINT ? 'Digital' : 'Manual',
      ];
      return (allSchools ? [escape(log.school.name), ...columns] : columns).join(';');
    });
    const header = allSchools ? 'Escola;Nome;Data/Hora (UTC);Método' : 'Nome;Data/Hora (UTC);Método';
    return [header, ...lines].join('\n');
  }

  /** Chamado quando o Arduino responde "!found<posição>#". */
  async registerByFingerprint(schoolId: number, fingerprintId: number) {
    const student = await this.prisma.student.findFirst({
      where: { schoolId, fingerprintId },
      include: { course: { select: { id: true, name: true } } },
    });
    if (!student) throw notFound('Digital não vinculada a nenhum aluno', 'FINGERPRINT_NOT_FOUND');
    return this.register(schoolId, student, AccessMethod.FINGERPRINT);
  }

  /** Registro manual pelo RM (contingência quando o leitor biométrico não está disponível). */
  async registerManual(schoolId: number, rm: string) {
    const student = await this.prisma.student.findFirst({
      where: { schoolId, rm: { equals: rm, mode: 'insensitive' } },
      include: { course: { select: { id: true, name: true } } },
    });
    if (!student) throw notFound('Nenhum aluno encontrado com esse RM', 'STUDENT_NOT_FOUND');
    return this.register(schoolId, student, AccessMethod.MANUAL);
  }

  private async register(
    schoolId: number,
    student: Parameters<typeof toStudentDto>[0],
    method: AccessMethod,
  ) {
    const log = await this.prisma.accessLog.create({
      data: { schoolId, studentId: student.id, studentName: student.name, method },
    });
    return { log, student: toStudentDto(student) };
  }

  private buildWhere(schoolId: number | null, query: ListAccessLogsQuery): Prisma.AccessLogWhereInput {
    return {
      ...(schoolId === null ? {} : { schoolId }),
      createdAt: query.from || query.to ? { gte: query.from, lte: query.to } : undefined,
      studentName: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
    };
  }
}
