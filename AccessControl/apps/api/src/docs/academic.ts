/** Trecho do OpenAPI do módulo acadêmico: disciplinas, professores, turmas, matrículas e grade. */

interface DocHelpers {
  ref: (name: string) => object;
  json: (schema: object) => object;
  errorResponse: (description: string) => object;
  authErrors: Record<string, object>;
  validationError: object;
  notFound: object;
  idParam: object;
}

const pathParam = (name: string, description: string) => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
});

export const academicTags = [
  { name: 'Disciplinas', description: 'Disciplinas da escola' },
  { name: 'Professores', description: 'Professores da escola (cadastro, sem login nesta etapa)' },
  { name: 'Turmas', description: 'Turmas, alunos, professores por disciplina e grade semanal' },
];

export function academicPaths({ ref, json, errorResponse, authErrors, validationError, notFound, idParam }: DocHelpers) {
  const crud = (
    tag: string,
    noun: string,
    schema: string,
    input: string,
    conflicts: { create?: object; remove: object },
  ) => ({
    collection: {
      get: {
        tags: [tag],
        summary: `Lista ${noun} (ordem alfabética)`,
        responses: { 200: { description: 'Lista', content: json({ type: 'array', items: ref(schema) }) }, ...authErrors },
      },
      post: {
        tags: [tag],
        summary: `Cadastra ${noun}`,
        requestBody: { required: true, content: json(ref(input)) },
        responses: {
          201: { description: 'Criado', content: json(ref(schema)) },
          400: validationError,
          ...(conflicts.create ? { 409: conflicts.create } : {}),
          ...authErrors,
        },
      },
    },
    item: {
      parameters: [idParam],
      put: {
        tags: [tag],
        summary: `Edita ${noun}`,
        requestBody: { required: true, content: json(ref(input)) },
        responses: {
          200: { description: 'Atualizado', content: json(ref(schema)) },
          400: validationError,
          404: notFound,
          ...(conflicts.create ? { 409: conflicts.create } : {}),
          ...authErrors,
        },
      },
      delete: {
        tags: [tag],
        summary: `Exclui ${noun}`,
        responses: { 204: { description: 'Excluído' }, 404: notFound, 409: conflicts.remove, ...authErrors },
      },
    },
  });

  const subjects = crud('Disciplinas', 'disciplinas', 'Subject', 'SubjectInput', {
    create: errorResponse('Já existe disciplina com esse nome (`SUBJECT_EXISTS`)'),
    remove: errorResponse('A disciplina está em uso em turmas ou na grade (`SUBJECT_IN_USE`)'),
  });
  const teachers = crud('Professores', 'professores', 'Teacher', 'TeacherInput', {
    remove: errorResponse('O professor leciona disciplinas em turmas (`TEACHER_IN_USE`)'),
  });
  const groupExists = errorResponse('Já existe turma com esse nome no ano letivo (`CLASS_GROUP_EXISTS`)');
  const invalidCourse = errorResponse('Dados inválidos (`VALIDATION_ERROR`) ou curso de outra escola (`INVALID_COURSE`)');

  return {
    '/api/subjects': subjects.collection,
    '/api/subjects/{id}': subjects.item,
    '/api/teachers': teachers.collection,
    '/api/teachers/{id}': teachers.item,
    '/api/class-groups': {
      get: {
        tags: ['Turmas'],
        summary: 'Lista as turmas de um ano letivo',
        parameters: [
          {
            name: 'schoolYear',
            in: 'query',
            description: 'Ano letivo (padrão: o ano atual em São Paulo)',
            schema: { type: 'integer', example: 2026 },
          },
        ],
        responses: {
          200: { description: 'Turmas', content: json({ type: 'array', items: ref('ClassGroup') }) },
          400: validationError,
          ...authErrors,
        },
      },
      post: {
        tags: ['Turmas'],
        summary: 'Cadastra uma turma',
        requestBody: { required: true, content: json(ref('ClassGroupInput')) },
        responses: {
          201: { description: 'Turma criada', content: json(ref('ClassGroup')) },
          400: invalidCourse,
          409: groupExists,
          ...authErrors,
        },
      },
    },
    '/api/class-groups/copy': {
      post: {
        tags: ['Turmas'],
        summary: 'Copia as turmas de um ano letivo para outro',
        description:
          'Copia nome, turno, curso, professores por disciplina e a grade vigente, sem alunos. ' +
          'Turmas com nome já existente no ano de destino são puladas.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['fromYear', 'toYear'],
            properties: { fromYear: { type: 'integer', example: 2025 }, toYear: { type: 'integer', example: 2026 } },
          }),
        },
        responses: {
          200: {
            description: 'Resultado da cópia',
            content: json({
              type: 'object',
              properties: {
                created: { type: 'integer', example: 6 },
                skipped: { type: 'array', items: { type: 'string' }, example: ['3º DS A'] },
              },
            }),
          },
          400: errorResponse('Dados inválidos (`VALIDATION_ERROR`) ou anos iguais (`INVALID_YEAR`)'),
          ...authErrors,
        },
      },
    },
    '/api/class-groups/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Turmas'],
        summary: 'Mostra a turma com as disciplinas e os professores',
        responses: { 200: { description: 'Turma', content: json(ref('ClassGroupDetail')) }, 404: notFound, ...authErrors },
      },
      put: {
        tags: ['Turmas'],
        summary: 'Edita a turma',
        requestBody: { required: true, content: json(ref('ClassGroupInput')) },
        responses: {
          200: { description: 'Turma atualizada', content: json(ref('ClassGroup')) },
          400: invalidCourse,
          404: notFound,
          409: groupExists,
          ...authErrors,
        },
      },
      delete: {
        tags: ['Turmas'],
        summary: 'Exclui a turma',
        responses: {
          204: { description: 'Turma excluída' },
          404: notFound,
          409: errorResponse('A turma já teve alunos (`CLASS_GROUP_HAS_STUDENTS`)'),
          ...authErrors,
        },
      },
    },
    '/api/class-groups/{id}/students': {
      parameters: [idParam],
      get: {
        tags: ['Turmas'],
        summary: 'Lista os alunos com matrícula aberta na turma',
        responses: {
          200: {
            description: 'Alunos da turma',
            content: json({
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  name: { type: 'string' },
                  rm: { type: 'string' },
                  enrolledSince: { type: 'string', format: 'date', example: '2026-02-02' },
                },
              },
            }),
          },
          404: notFound,
          ...authErrors,
        },
      },
      post: {
        tags: ['Turmas'],
        summary: 'Coloca alunos na turma (transfere quem estava em outra turma do mesmo ano)',
        description:
          'A troca de turma fecha a matrícula antiga hoje e abre a nova hoje. Se a matrícula antiga começou hoje, ' +
          'ela só é corrigida para esta turma.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['studentIds'],
            properties: { studentIds: { type: 'array', items: { type: 'integer' }, minItems: 1, maxItems: 500 } },
          }),
        },
        responses: {
          200: {
            description: 'Quantos foram matriculados e quantos vieram de outra turma',
            content: json({
              type: 'object',
              properties: { added: { type: 'integer', example: 3 }, moved: { type: 'integer', example: 1 } },
            }),
          },
          400: errorResponse('Dados inválidos (`VALIDATION_ERROR`) ou aluno de outra escola (`INVALID_STUDENT`)'),
          404: notFound,
          ...authErrors,
        },
      },
    },
    '/api/class-groups/{id}/students/{studentId}': {
      parameters: [idParam, pathParam('studentId', 'ID do aluno')],
      delete: {
        tags: ['Turmas'],
        summary: 'Retira o aluno da turma (encerra a matrícula hoje)',
        responses: { 204: { description: 'Aluno retirado' }, 404: notFound, ...authErrors },
      },
    },
    '/api/class-groups/{id}/assignments/{subjectId}': {
      parameters: [idParam, pathParam('subjectId', 'ID da disciplina')],
      put: {
        tags: ['Turmas'],
        summary: 'Define o professor da disciplina na turma',
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['teacherId'], properties: { teacherId: { type: 'integer' } } }),
        },
        responses: {
          200: { description: 'Disciplina e professor', content: json(ref('Assignment')) },
          400: errorResponse(
            'Dados inválidos (`VALIDATION_ERROR`), disciplina (`INVALID_SUBJECT`) ou professor (`INVALID_TEACHER`) de outra escola',
          ),
          404: notFound,
          ...authErrors,
        },
      },
      delete: {
        tags: ['Turmas'],
        summary: 'Retira a disciplina da turma',
        responses: {
          204: { description: 'Disciplina retirada' },
          404: notFound,
          409: errorResponse('A disciplina está na grade vigente da turma (`ASSIGNMENT_IN_USE`)'),
          ...authErrors,
        },
      },
    },
    '/api/class-groups/{id}/timetable': {
      parameters: [idParam],
      get: {
        tags: ['Turmas'],
        summary: 'Grade semanal vigente hoje',
        responses: { 200: { description: 'Grade', content: json(ref('Timetable')) }, 404: notFound, ...authErrors },
      },
      put: {
        tags: ['Turmas'],
        summary: 'Salva a grade semanal (vale a partir de hoje)',
        description:
          'Substitui a grade da turma a partir de hoje; gravações no mesmo dia substituem a versão do dia. ' +
          'Professor em outra turma no mesmo horário não impede a gravação: volta em `warnings`.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['blocks'],
            properties: { blocks: { type: 'array', maxItems: 200, items: ref('TimetableBlockInput') } },
          }),
        },
        responses: {
          200: { description: 'Grade salva', content: json(ref('Timetable')) },
          400: errorResponse(
            'Dados inválidos (`VALIDATION_ERROR`), aulas sobrepostas (`TIMETABLE_OVERLAP`) ou disciplina sem professor na turma (`SUBJECT_NOT_ASSIGNED`)',
          ),
          404: notFound,
          ...authErrors,
        },
      },
    },
  };
}

export function academicSchemas(ref: (name: string) => object) {
  const subjectSummary = {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 5 },
      name: { type: 'string', example: 'Matemática' },
      abbreviation: { type: 'string', example: 'Mat.' },
      color: { type: 'string', example: '#ffd9a8' },
    },
  };
  const person = {
    type: 'object',
    properties: { id: { type: 'integer', example: 8 }, name: { type: 'string', example: 'Ana Prado' } },
  };
  const minute = (example: number) => ({
    type: 'integer',
    minimum: 0,
    maximum: 1440,
    multipleOf: 5,
    description: 'Minutos desde 00:00',
    example,
  });
  return {
    Subject: subjectSummary,
    SubjectInput: {
      type: 'object',
      required: ['name', 'abbreviation', 'color'],
      properties: {
        name: { type: 'string', maxLength: 60, example: 'Matemática' },
        abbreviation: { type: 'string', maxLength: 8, example: 'Mat.' },
        color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$', example: '#ffd9a8' },
      },
    },
    Teacher: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 8 },
        name: { type: 'string', example: 'Ana Prado' },
        contactEmail: { type: 'string', nullable: true, example: 'ana@email.com' },
        assignmentsCount: { type: 'integer', example: 3 },
      },
    },
    TeacherInput: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Ana Prado' },
        contactEmail: { type: 'string', format: 'email', nullable: true, description: 'Opcional, só contato' },
      },
    },
    Shift: { type: 'string', enum: ['MORNING', 'AFTERNOON', 'EVENING', 'FULL_TIME'], description: 'Turno' },
    ClassGroupInput: {
      type: 'object',
      required: ['name', 'schoolYear', 'shift'],
      properties: {
        name: { type: 'string', maxLength: 40, example: '2º DS A' },
        schoolYear: { type: 'integer', example: 2026 },
        shift: ref('Shift'),
        courseId: { type: 'integer', nullable: true, description: 'Opcional (ensino regular não tem curso)' },
      },
    },
    ClassGroup: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 20 },
        name: { type: 'string', example: '2º DS A' },
        schoolYear: { type: 'integer', example: 2026 },
        shift: ref('Shift'),
        course: { ...person, nullable: true },
        studentsCount: { type: 'integer', example: 31 },
      },
    },
    Assignment: { type: 'object', properties: { subject: subjectSummary, teacher: person } },
    ClassGroupDetail: {
      allOf: [
        ref('ClassGroup'),
        { type: 'object', properties: { assignments: { type: 'array', items: ref('Assignment') } } },
      ],
    },
    TimetableBlockInput: {
      type: 'object',
      required: ['kind', 'weekday', 'startMinute', 'endMinute'],
      properties: {
        kind: { type: 'string', enum: ['LESSON', 'BREAK'], description: 'Aula ou intervalo' },
        subjectId: { type: 'integer', nullable: true, description: 'Obrigatório em aula; vazio em intervalo' },
        weekday: { type: 'integer', minimum: 1, maximum: 6, description: '1 = segunda ... 6 = sábado' },
        startMinute: minute(450),
        endMinute: minute(500),
      },
    },
    Timetable: {
      type: 'object',
      properties: {
        validFrom: { type: 'string', format: 'date', nullable: true, description: 'Data em que esta versão passou a valer' },
        blocks: {
          type: 'array',
          items: {
            allOf: [
              ref('TimetableBlockInput'),
              {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  subject: { ...subjectSummary, nullable: true },
                  teacher: { ...person, nullable: true },
                },
              },
            ],
          },
        },
        warnings: {
          type: 'array',
          description: 'Professor em outra turma no mesmo horário (não impede a gravação)',
          items: {
            type: 'object',
            properties: {
              weekday: { type: 'integer' },
              startMinute: { type: 'integer' },
              endMinute: { type: 'integer' },
              teacherName: { type: 'string' },
              classGroupName: { type: 'string' },
            },
          },
        },
      },
    },
  };
}
