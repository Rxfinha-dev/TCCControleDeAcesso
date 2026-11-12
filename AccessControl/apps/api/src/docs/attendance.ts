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
  const studentRef = { id: { type: 'integer' }, name: { type: 'string' }, rm: { type: 'string' } };
  const groupRef = { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } };
  return {
    '/api/attendance/alerts': {
      get: {
        tags: [TAG],
        summary: 'Alunos que pedem atenção: frequência abaixo ou perto do mínimo e quem não passa na catraca há 7 dias',
        description: 'Só escola e super admin. O sumiço só é avaliado depois da primeira semana do bimestre.',
        responses: {
          200: {
            description: 'Alertas',
            content: json({
              type: 'object',
              properties: {
                minAttendance: { type: 'integer' },
                attendance: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { ...studentRef, classGroup: groupRef, percent: { type: 'number', nullable: true }, status: { type: 'string', enum: ['NEAR', 'BELOW'] } },
                  },
                },
                absent: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { ...studentRef, classGroup: groupRef, lastSeen: { type: 'string', format: 'date', nullable: true, description: '`null` = nunca passou' } },
                  },
                },
              },
            }),
          },
          ...authErrors,
        },
      },
    },
    '/api/attendance/justifications': {
      get: {
        tags: [TAG],
        summary: 'Faltas justificadas (atestados) dos alunos da turma',
        parameters: [classGroupQuery],
        responses: {
          200: {
            description: 'Atestados',
            content: json({
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  student: { type: 'object', properties: studentRef },
                  startDate: isoDay('2026-03-09'),
                  endDate: isoDay('2026-03-11'),
                  reason: { type: 'string', example: 'Atestado médico' },
                },
              },
            }),
          },
          400: validationError,
          404: notFound,
          ...authErrors,
        },
      },
      post: {
        tags: [TAG],
        summary: 'Registra um atestado: as faltas da catraca no período deixam de contar para o aluno',
        description: 'A aula justificada não entra como dada nem como presença. A correção manual continua valendo sobre o atestado.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['studentId', 'startDate', 'reason'],
            properties: {
              studentId: { type: 'integer', example: 11 },
              startDate: isoDay('2026-03-09'),
              endDate: { ...isoDay('2026-03-11'), description: 'Padrão: o mesmo dia do início' },
              reason: { type: 'string', maxLength: 200, example: 'Atestado médico' },
            },
          }),
        },
        responses: { 201: { description: 'Registrado' }, 400: validationError, 404: notFound, ...authErrors },
      },
    },
    '/api/attendance/justifications/{id}': {
      delete: {
        tags: [TAG],
        summary: 'Exclui um atestado',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
        responses: { 204: { description: 'Excluído' }, 404: notFound, ...authErrors },
      },
    },
    '/api/attendance/my-lessons': {
      get: {
        tags: [TAG],
        summary: 'Aulas do professor logado num dia, em todas as turmas dele',
        parameters: [{ name: 'date', in: 'query', schema: isoDay('2026-03-09'), description: 'Padrão: hoje' }],
        responses: { 200: { description: 'Aulas do dia', content: json(ref('TeacherLessons')) }, 400: validationError, ...authErrors },
      },
    },
    '/api/attendance/day': {
      get: {
        tags: [TAG],
        summary: 'Chamada de um dia: aulas da turma e presença de cada aluno (professor: só as aulas dele)',
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
        summary: 'Frequência dos alunos da turma, no total e por disciplina (professor: só as disciplinas dele)',
        parameters: [
          classGroupQuery,
          { name: 'from', in: 'query', schema: isoDay('2026-02-02'), description: 'Padrão: início do ano letivo da turma' },
          { name: 'to', in: 'query', schema: isoDay('2026-06-30'), description: 'Padrão: hoje' },
          { name: 'term', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 4 }, description: 'Bimestre: usa as datas dele (`TERM_NOT_FOUND` se não definido)' },
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
      properties: {
        minAttendance: { type: 'integer', minimum: 0, maximum: 100, example: 75, description: 'Frequência mínima (%)' },
        code: {
          type: 'string',
          nullable: true,
          example: 'etec-jau',
          description: 'Código dos logins (letras, números e hífen). Não muda depois de criados os logins (`SCHOOL_CODE_LOCKED`).',
        },
        grading: ref('Grading'),
      },
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
                    source: { type: 'string', enum: ['AUTO', 'MANUAL', 'COLLECTIVE', 'JUSTIFIED'], description: 'JUSTIFIED = falta com atestado (`present: null`, não conta)' },
                  },
                },
              },
            },
          },
        },
      },
    },
    TeacherLessons: {
      type: 'object',
      properties: {
        date: isoDay('2026-03-09'),
        day: { type: 'object', properties: { kind: { type: 'string' }, name: { type: 'string' } } },
        classGroups: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } } },
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              classGroup: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } },
              startMinute: { type: 'integer', example: 450 },
              endMinute: { type: 'integer', example: 500 },
              subject: ref('Subject'),
              cancellation: { ...ref('CancellationReason'), nullable: true },
              finished: { type: 'boolean' },
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
        term: { type: 'integer', nullable: true, description: 'Bimestre pedido' },
        terms: { type: 'array', items: { type: 'integer' }, description: 'Bimestres definidos no ano' },
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
