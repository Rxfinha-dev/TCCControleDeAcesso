/** Trecho do OpenAPI da presença por aula e das configurações acadêmicas da escola. */

interface DocHelpers {
  ref: (name: string) => object;
  json: (schema: object) => object;
  errorResponse: (description: string) => object;
  authErrors: Record<string, object>;
  validationError: object;
  notFound: object;
}

const TAG = 'Presença';
const isoDay = (example: string) => ({ type: 'string', format: 'date', example });
const classGroupQuery = { name: 'classGroupId', in: 'query', required: true, schema: { type: 'integer', minimum: 1 } };
const lessonKey = {
  classGroupId: { type: 'integer', example: 20 },
  date: isoDay('2026-03-09'),
  startMinute: { type: 'integer', example: 450, description: 'Início da aula, em minutos desde 00:00' },
};

export const attendanceTags = [
  {
    name: TAG,
    description:
      'Presença por aula, calculada das leituras da catraca + grade + calendário. Só correções manuais e aulas canceladas são gravadas.',
  },
  { name: 'Configurações', description: 'Configurações acadêmicas da escola' },
];

export function attendancePaths({ ref, json, errorResponse, authErrors, validationError, notFound }: DocHelpers) {
  const lessonNotFound = errorResponse('Turma não encontrada ou sem aula nesse dia e horário (`LESSON_NOT_FOUND`)');
  return {
    '/api/attendance/day': {
      get: {
        tags: [TAG],
        summary: 'Chamada de um dia: aulas da turma e presença de cada aluno',
        description:
          'Presença = o aluno ficou dentro da escola por pelo menos metade da aula (leituras alternam entrada/saída; ' +
          'leitura repetida em até 1 minuto é ignorada; sem saída, vale até o fim do dia). ' +
          'Aula ainda não terminada vem com `present: null`. Em dia sem aula, `lessons` e `students` vêm vazios.',
        parameters: [classGroupQuery, { name: 'date', in: 'query', schema: isoDay('2026-03-09'), description: 'Padrão: hoje' }],
        responses: { 200: { description: 'Chamada', content: json(ref('AttendanceDay')) }, 400: validationError, 404: notFound, ...authErrors },
      },
    },
    '/api/attendance/summary': {
      get: {
        tags: [TAG],
        summary: 'Frequência dos alunos da turma, no total e por disciplina',
        parameters: [
          classGroupQuery,
          { name: 'from', in: 'query', schema: isoDay('2026-02-02'), description: 'Padrão: início do ano letivo da turma' },
          { name: 'to', in: 'query', schema: isoDay('2026-06-30'), description: 'Padrão: hoje' },
        ],
        responses: {
          200: { description: 'Frequência', content: json(ref('AttendanceSummary')) },
          400: validationError,
          404: notFound,
          ...authErrors,
        },
      },
    },
    '/api/attendance/override': {
      put: {
        tags: [TAG],
        summary: 'Corrige a presença de um aluno numa aula (prevalece sobre a catraca)',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['classGroupId', 'date', 'startMinute', 'studentId', 'present'],
            properties: {
              ...lessonKey,
              studentId: { type: 'integer', example: 10 },
              present: { type: 'boolean', nullable: true, description: '`null` desfaz a correção (volta ao automático)' },
            },
          }),
        },
        responses: {
          204: { description: 'Gravado' },
          400: errorResponse('Dados inválidos ou aluno fora da turma nesse dia (`INVALID_STUDENT`)'),
          404: lessonNotFound,
          ...authErrors,
        },
      },
    },
    '/api/attendance/cancellation': {
      put: {
        tags: [TAG],
        summary: 'Marca falta do professor ou aula cancelada (a turma inteira recebe presença)',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['classGroupId', 'date', 'startMinute', 'reason'],
            properties: { ...lessonKey, reason: { ...ref('CancellationReason'), nullable: true, description: '`null` desfaz' } },
          }),
        },
        responses: { 204: { description: 'Gravado' }, 400: validationError, 404: lessonNotFound, ...authErrors },
      },
    },
    '/api/settings': {
      get: {
        tags: ['Configurações'],
        summary: 'Configurações acadêmicas da escola',
        responses: { 200: { description: 'Configurações', content: json(ref('SchoolSettings')) }, ...authErrors },
      },
      put: {
        tags: ['Configurações'],
        summary: 'Altera as configurações acadêmicas',
        requestBody: { required: true, content: json(ref('SchoolSettings')) },
        responses: { 200: { description: 'Atualizado', content: json(ref('SchoolSettings')) }, 400: validationError, ...authErrors },
      },
    },
  };
}

export function attendanceSchemas(ref: (name: string) => object) {
  const tally = {
    given: { type: 'integer', description: 'Aulas dadas (terminadas)', example: 40 },
    present: { type: 'integer', example: 34 },
    percent: { type: 'number', nullable: true, example: 85, description: '`null` quando ainda não houve aula' },
    status: { type: 'string', enum: ['OK', 'NEAR', 'BELOW'], description: 'NEAR = a menos de 5 pontos do mínimo' },
  };
  const studentRef = { id: { type: 'integer' }, name: { type: 'string' }, rm: { type: 'string' } };
  return {
    CancellationReason: { type: 'string', enum: ['TEACHER_ABSENT', 'CANCELLED'] },
    SchoolSettings: {
      type: 'object',
      required: ['minAttendance'],
      properties: { minAttendance: { type: 'integer', minimum: 0, maximum: 100, example: 75, description: 'Frequência mínima (%)' } },
    },
    AttendanceDay: {
      type: 'object',
      properties: {
        date: isoDay('2026-03-09'),
        day: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['SCHOOL_DAY', 'WEEKEND', 'HOLIDAY', 'NO_CLASS', 'OUT_OF_TERM'] },
            name: { type: 'string', description: 'Nome do feriado ou do dia sem aula' },
          },
        },
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startMinute: { type: 'integer', example: 450 },
              endMinute: { type: 'integer', example: 500 },
              subject: ref('Subject'),
              teacher: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } },
              cancellation: { ...ref('CancellationReason'), nullable: true },
              finished: { type: 'boolean' },
            },
          },
        },
        students: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ...studentRef,
              marks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    startMinute: { type: 'integer', example: 450 },
                    present: { type: 'boolean', nullable: true },
                    source: { type: 'string', enum: ['AUTO', 'MANUAL', 'COLLECTIVE'] },
                  },
                },
              },
            },
          },
        },
      },
    },
    AttendanceSummary: {
      type: 'object',
      properties: {
        from: isoDay('2026-02-02'),
        to: isoDay('2026-06-30'),
        minAttendance: { type: 'integer', example: 75 },
        subjects: { type: 'array', items: ref('Subject') },
        students: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ...studentRef,
              ...tally,
              subjects: { type: 'array', items: { type: 'object', properties: { subjectId: { type: 'integer' }, ...tally } } },
            },
          },
        },
      },
    },
  };
}
