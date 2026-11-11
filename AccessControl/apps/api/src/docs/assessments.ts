/** Trecho do OpenAPI das avaliações, notas e médias. */

interface DocHelpers {
  ref: (name: string) => object;
  json: (schema: object) => object;
  errorResponse: (description: string) => object;
  authErrors: Record<string, object>;
  validationError: object;
  notFound: object;
  idParam: object;
}

const TAG = 'Avaliações';
const classGroupQuery = { name: 'classGroupId', in: 'query', required: true, schema: { type: 'integer', minimum: 1 } };
const student = { id: { type: 'integer' }, name: { type: 'string' }, rm: { type: 'string' } };

export const assessmentsTags = [
  {
    name: TAG,
    description:
      'Provas e trabalhos, notas e médias. Escola e super admin mexem em qualquer uma; o professor só nas disciplinas atribuídas a ele.',
  },
];

export function assessmentsPaths({ ref, json, errorResponse, authErrors, validationError, notFound, idParam }: DocHelpers) {
  const invalid = errorResponse(
    'Dados inválidos, disciplina não atribuída na turma (`INVALID_SUBJECT`), data fora dos bimestres (`OUT_OF_TERM`) ' +
      'ou prova sem aula da disciplina nesse dia e horário (`NO_LESSON`)',
  );
  return {
    '/api/assessments': {
      get: {
        tags: [TAG],
        summary: 'Avaliações da turma, disciplinas em que quem pede pode criar e o sistema de notas',
        parameters: [classGroupQuery],
        responses: {
          200: {
            description: 'Avaliações',
            content: json({
              type: 'object',
              properties: {
                grading: ref('Grading'),
                subjects: { type: 'array', items: ref('Subject') },
                assessments: { type: 'array', items: ref('Assessment') },
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
        summary: 'Cria uma prova ou um trabalho',
        description: 'Prova exige a aula (`startMinute`) da disciplina naquele dia. Trabalho só precisa da data.',
        requestBody: { required: true, content: json(ref('AssessmentInput')) },
        responses: { 201: { description: 'Criada', content: json(ref('Assessment')) }, 400: invalid, 404: notFound, ...authErrors },
      },
    },
    '/api/assessments/{id}': {
      put: {
        tags: [TAG],
        summary: 'Altera a avaliação (a turma não muda)',
        parameters: [idParam],
        requestBody: { required: true, content: json(ref('AssessmentInput')) },
        responses: { 200: { description: 'Atualizada', content: json(ref('Assessment')) }, 400: invalid, 404: notFound, ...authErrors },
      },
      delete: {
        tags: [TAG],
        summary: 'Exclui a avaliação e as notas dela',
        parameters: [idParam],
        responses: { 204: { description: 'Excluída' }, 404: notFound, ...authErrors },
      },
    },
    '/api/assessments/{id}/grades': {
      get: {
        tags: [TAG],
        summary: 'Lista de lançamento: alunos da turma no dia da avaliação e a nota de cada um',
        parameters: [idParam],
        responses: {
          200: {
            description: 'Notas',
            content: json({
              type: 'object',
              properties: {
                grading: ref('Grading'),
                assessment: ref('Assessment'),
                students: {
                  type: 'array',
                  items: { type: 'object', properties: { ...student, value: { type: 'number', nullable: true, description: '`null` = sem nota' } } },
                },
              },
            }),
          },
          404: notFound,
          ...authErrors,
        },
      },
      put: {
        tags: [TAG],
        summary: 'Lança, altera ou apaga notas',
        description: 'Conceitos são enviados pelo valor numérico. `value: null` apaga a nota.',
        parameters: [idParam],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['grades'],
            properties: {
              grades: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['studentId', 'value'],
                  properties: { studentId: { type: 'integer' }, value: { type: 'number', nullable: true, example: 7.5 } },
                },
              },
            },
          }),
        },
        responses: {
          204: { description: 'Gravado' },
          400: errorResponse('Nota fora do sistema de notas (`INVALID_GRADE`) ou aluno fora da turma no dia (`INVALID_STUDENT`)'),
          404: notFound,
          ...authErrors,
        },
      },
    },
    '/api/assessments/report': {
      get: {
        tags: [TAG],
        summary: 'Médias bimestrais, semestrais e anual dos alunos da turma, por disciplina',
        description:
          'Bimestral: média ponderada pelos pesos. Semestral e anual: média simples dos bimestres que têm nota. ' +
          'Aluno sem nota numa avaliação fica fora da média até ela ser lançada.',
        parameters: [classGroupQuery],
        responses: {
          200: {
            description: 'Médias',
            content: json({
              type: 'object',
              properties: {
                grading: ref('Grading'),
                subjects: { type: 'array', items: ref('Subject') },
                students: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { ...student, subjects: { type: 'array', items: ref('SubjectAverages') } },
                  },
                },
              },
            }),
          },
          400: validationError,
          404: notFound,
          ...authErrors,
        },
      },
    },
  };
}

export function assessmentsSchemas(ref: (name: string) => object) {
  const fields = {
    kind: { type: 'string', enum: ['EXAM', 'ASSIGNMENT'], description: 'Prova ou trabalho' },
    date: { type: 'string', format: 'date', example: '2026-03-09' },
    startMinute: { type: 'integer', nullable: true, example: 450, description: 'Início da aula da prova (minutos desde 00:00)' },
    title: { type: 'string', maxLength: 100, example: 'Prova 1' },
    content: { type: 'string', nullable: true, maxLength: 2000, example: 'Funções do 1º grau' },
    note: { type: 'string', nullable: true, maxLength: 300, example: 'Trazer calculadora' },
    weight: { type: 'number', example: 1, description: 'Peso na média do bimestre (padrão 1)' },
  };
  const cell = {
    type: 'object',
    properties: {
      value: { type: 'number', nullable: true },
      label: { type: 'string', nullable: true, example: '7,5', description: 'Como exibir: número ou conceito' },
      passed: { type: 'boolean', nullable: true, description: '`null` = ainda sem nota' },
    },
  };
  return {
    Grading: {
      type: 'object',
      description: 'Sistema de notas da escola. Não muda depois da primeira nota lançada (`GRADING_LOCKED`).',
      properties: {
        kind: { type: 'string', enum: ['NUMERIC', 'CONCEPT'] },
        max: { type: 'integer', enum: [10, 100] },
        decimals: { type: 'integer', minimum: 0, maximum: 2 },
        passing: { type: 'number', example: 6, description: 'Menor nota (ou valor de conceito) que aprova' },
        concepts: {
          type: 'array',
          description: 'Só em CONCEPT, do maior para o menor',
          items: { type: 'object', properties: { label: { type: 'string', example: 'MB' }, value: { type: 'number', example: 4 } } },
        },
      },
    },
    AssessmentInput: {
      type: 'object',
      required: ['classGroupId', 'subjectId', 'kind', 'date', 'title'],
      properties: { classGroupId: { type: 'integer', example: 20 }, subjectId: { type: 'integer', example: 1 }, ...fields },
    },
    Assessment: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        classGroupId: { type: 'integer' },
        ...fields,
        subject: ref('Subject'),
        gradesCount: { type: 'integer', description: 'Notas já lançadas (só na listagem)' },
      },
    },
    SubjectAverages: {
      type: 'object',
      properties: {
        subjectId: { type: 'integer' },
        terms: { type: 'array', items: cell, description: 'Bimestres 1 a 4' },
        semesters: { type: 'array', items: cell, description: 'Semestres 1 e 2' },
        annual: cell,
      },
    },
  };
}
