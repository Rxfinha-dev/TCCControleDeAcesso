/** Trecho do OpenAPI do boletim e do painel do aluno. */

interface DocHelpers {
  ref: (name: string) => object;
  json: (schema: object) => object;
  authErrors: Record<string, object>;
  notFound: object;
  idParam: object;
}

const TAG = 'Boletim';
const tally = {
  type: 'object',
  properties: {
    given: { type: 'integer', description: 'Aulas dadas' },
    present: { type: 'integer' },
    percent: { type: 'number', nullable: true },
    status: { type: 'string', enum: ['OK', 'NEAR', 'BELOW'] },
  },
};
const cell = {
  type: 'object',
  properties: { value: { type: 'number', nullable: true }, label: { type: 'string', nullable: true }, passed: { type: 'boolean', nullable: true } },
};
const marked = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    kind: { type: 'string', enum: ['EXAM', 'ASSIGNMENT'] },
    title: { type: 'string' },
    content: { type: 'string', nullable: true },
    note: { type: 'string', nullable: true },
    date: { type: 'string', format: 'date' },
    startMinute: { type: 'integer', nullable: true },
  },
};

export const reportCardTags = [
  { name: TAG, description: 'Boletim do ano letivo (frequência, notas e médias por disciplina) e painel do aluno.' },
];

export function reportCardPaths({ ref, json, authErrors, notFound, idParam }: DocHelpers) {
  return {
    '/api/report-cards/{id}': {
      get: {
        tags: [TAG],
        summary: 'Boletim de um aluno da escola (escola e super admin)',
        description: 'Cobre o ano letivo atual até hoje. Documento de acompanhamento, não oficial. O PDF é gerado pelo navegador (imprimir).',
        parameters: [idParam],
        responses: { 200: { description: 'Boletim', content: json(ref('ReportCard')) }, 404: notFound, ...authErrors },
      },
    },
    '/api/student/panel': {
      get: {
        tags: [TAG],
        summary: 'Painel do aluno logado: boletim, grade da semana e próximas avaliações',
        description: 'Só para o perfil STUDENT. O aluno vem do login, nunca da requisição.',
        responses: {
          200: {
            description: 'Painel',
            content: json({
              type: 'object',
              properties: {
                reportCard: ref('ReportCard'),
                week: {
                  type: 'array',
                  description: 'Segunda a sábado desta semana',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date' },
                      day: { type: 'object', properties: { kind: { type: 'string' }, name: { type: 'string' } } },
                      lessons: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            startMinute: { type: 'integer' },
                            endMinute: { type: 'integer' },
                            subject: ref('Subject'),
                            cancellation: { type: 'string', nullable: true },
                            assessments: { type: 'array', items: marked, description: 'Prova ou trabalho nessa aula' },
                          },
                        },
                      },
                    },
                  },
                },
                upcoming: { type: 'array', items: { ...marked, properties: { ...marked.properties, subject: ref('Subject') } } },
              },
            }),
          },
          ...authErrors,
        },
      },
    },
  };
}

export function reportCardSchemas(ref: (name: string) => object) {
  return {
    ReportCard: {
      type: 'object',
      properties: {
        school: { type: 'object', properties: { name: { type: 'string' } } },
        student: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, rm: { type: 'string' } } },
        classGroup: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } },
        schoolYear: { type: 'integer', example: 2026 },
        issuedOn: { type: 'string', format: 'date' },
        minAttendance: { type: 'integer', example: 75 },
        grading: ref('Grading'),
        attendance: tally,
        subjects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: ref('Subject'),
              attendance: tally,
              assessments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    kind: { type: 'string', enum: ['EXAM', 'ASSIGNMENT'] },
                    title: { type: 'string' },
                    date: { type: 'string', format: 'date' },
                    weight: { type: 'number' },
                    term: { type: 'integer', nullable: true },
                    grade: cell,
                  },
                },
              },
              terms: { type: 'array', items: cell },
              semesters: { type: 'array', items: cell },
              annual: cell,
            },
          },
        },
      },
    },
  };
}
