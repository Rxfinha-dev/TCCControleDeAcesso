/** Trecho do OpenAPI do calendário escolar: feriados, dias sem aula e bimestres. */

interface DocHelpers {
  ref: (name: string) => object;
  json: (schema: object) => object;
  errorResponse: (description: string) => object;
  authErrors: Record<string, object>;
  validationError: object;
  notFound: object;
  idParam: object;
}

const TAG = 'Calendário';
const isoDay = (example: string) => ({ type: 'string', format: 'date', example });

export const calendarTags = [{ name: TAG, description: 'Feriados nacionais, dias sem aula e bimestres da escola' }];

export function calendarPaths({ ref, json, errorResponse, authErrors, validationError, notFound, idParam }: DocHelpers) {
  return {
    '/api/calendar': {
      get: {
        tags: [TAG],
        summary: 'Calendário do ano: feriados nacionais, dias sem aula e bimestres',
        description:
          'Na primeira vez que um ano é aberto, os feriados nacionais são buscados na BrasilAPI. ' +
          'Se ela falhar, `holidaysLoaded` vem `false` e o calendário funciona sem os feriados.',
        parameters: [{ name: 'year', in: 'query', schema: { type: 'integer', example: 2026 }, description: 'Padrão: ano atual' }],
        responses: { 200: { description: 'Calendário', content: json(ref('Calendar')) }, 400: validationError, ...authErrors },
      },
    },
    '/api/calendar/holidays/{date}': {
      put: {
        tags: [TAG],
        summary: 'Desmarca ou remarca um feriado nacional para a escola',
        parameters: [{ name: 'date', in: 'path', required: true, schema: isoDay('2026-04-21') }],
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['active'], properties: { active: { type: 'boolean' } } }),
        },
        responses: {
          204: { description: 'Atualizado' },
          400: validationError,
          404: errorResponse('O dia não é um feriado nacional (`HOLIDAY_NOT_FOUND`)'),
          ...authErrors,
        },
      },
    },
    '/api/calendar/no-class-days': {
      post: {
        tags: [TAG],
        summary: 'Cadastra um dia (ou intervalo) sem aula para a escola inteira',
        requestBody: { required: true, content: json(ref('NoClassDayInput')) },
        responses: { 201: { description: 'Criado', content: json(ref('NoClassDay')) }, 400: validationError, ...authErrors },
      },
    },
    '/api/calendar/no-class-days/{id}': {
      parameters: [idParam],
      put: {
        tags: [TAG],
        summary: 'Edita um dia sem aula',
        requestBody: { required: true, content: json(ref('NoClassDayInput')) },
        responses: {
          200: { description: 'Atualizado', content: json(ref('NoClassDay')) },
          400: validationError,
          404: notFound,
          ...authErrors,
        },
      },
      delete: {
        tags: [TAG],
        summary: 'Exclui um dia sem aula',
        responses: { 204: { description: 'Excluído' }, 404: notFound, ...authErrors },
      },
    },
    '/api/calendar/terms/{schoolYear}': {
      put: {
        tags: [TAG],
        summary: 'Define os 4 bimestres do ano letivo (substitui os anteriores)',
        description: 'Os bimestres precisam estar em ordem e não podem se sobrepor. Semestres são derivados (1º+2º e 3º+4º).',
        parameters: [{ name: 'schoolYear', in: 'path', required: true, schema: { type: 'integer', example: 2026 } }],
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['terms'],
            properties: { terms: { type: 'array', minItems: 4, maxItems: 4, items: ref('SchoolTerm') } },
          }),
        },
        responses: {
          200: { description: 'Bimestres gravados', content: json({ type: 'array', items: ref('SchoolTerm') }) },
          400: validationError,
          ...authErrors,
        },
      },
    },
  };
}

export function calendarSchemas(ref: (name: string) => object) {
  return {
    Holiday: {
      type: 'object',
      properties: {
        date: isoDay('2026-04-21'),
        name: { type: 'string', example: 'Tiradentes' },
        active: { type: 'boolean', description: '`false` quando a escola desmarcou o feriado (vira dia letivo)' },
      },
    },
    NoClassDayInput: {
      type: 'object',
      required: ['name', 'startDate'],
      properties: {
        name: { type: 'string', maxLength: 80, example: 'Recesso de julho' },
        startDate: isoDay('2026-07-13'),
        endDate: { ...isoDay('2026-07-24'), description: 'Opcional; sem ele, vale só o dia de início' },
      },
    },
    NoClassDay: {
      type: 'object',
      properties: {
        id: { type: 'integer', example: 7 },
        name: { type: 'string', example: 'Recesso de julho' },
        startDate: isoDay('2026-07-13'),
        endDate: isoDay('2026-07-24'),
      },
    },
    SchoolTerm: {
      type: 'object',
      required: ['number', 'startDate', 'endDate'],
      properties: {
        number: { type: 'integer', minimum: 1, maximum: 4, example: 1 },
        startDate: isoDay('2026-02-02'),
        endDate: isoDay('2026-04-17'),
      },
    },
    Calendar: {
      type: 'object',
      properties: {
        year: { type: 'integer', example: 2026 },
        holidaysLoaded: { type: 'boolean' },
        holidays: { type: 'array', items: ref('Holiday') },
        noClassDays: { type: 'array', items: ref('NoClassDay') },
        terms: { type: 'array', items: ref('SchoolTerm') },
      },
    },
  };
}
