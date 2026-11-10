/**
 * Especificação OpenAPI 3 da API, exibida pelo Swagger UI em /docs (JSON em /docs.json).
 * Ao criar ou alterar uma rota, atualize também o trecho correspondente aqui.
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const errorResponse = (description: string) => ({ description, content: json(ref('Error')) });

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'ID do registro',
  schema: { type: 'integer', minimum: 1 },
};

/** Respostas de erro comuns a todas as rotas protegidas. */
const authErrors = {
  401: errorResponse('Token ausente, inválido, expirado ou de sessão encerrada (`UNAUTHORIZED`, `INVALID_TOKEN`)'),
  403: errorResponse('E-mail da conta ainda não confirmado (`EMAIL_NOT_VERIFIED`)'),
  429: errorResponse('Limite de requisições atingido (300 por minuto)'),
  503: errorResponse('Supabase Auth indisponível para validar o login (`AUTH_UNAVAILABLE`)'),
};

const validationError = {
  description: 'Dados inválidos (`VALIDATION_ERROR`)',
  content: json(ref('ValidationError')),
};

const notFound = errorResponse('Registro não encontrado (`NOT_FOUND`)');

/** Escola em uso nas rotas por escola (cursos, alunos, entradas, resumo). */
const schoolHeader = {
  name: 'X-School-Id',
  in: 'header',
  required: false,
  description:
    'Escola em uso. Login de escola: opcional (só a própria escola). Super admin: id de qualquer escola, ' +
    'ou `all` (todas) em `GET /api/access-logs`, `GET /api/access-logs/export` e `GET /api/stats`. ' +
    'Sem o cabeçalho, vale a escola do usuário.',
  schema: { type: 'string', example: '1' },
};

/** Erros de escopo das rotas por escola. */
const scopeErrors = {
  400: errorResponse('Escola inválida (`INVALID_SCHOOL_ID`) ou não selecionada (`SCHOOL_REQUIRED`)'),
  403: errorResponse('Sem acesso à escola (`SCHOOL_FORBIDDEN`) ou perfil sem acesso ao painel (`NO_PANEL_ACCESS`)'),
};

const superAdminErrors = {
  ...authErrors,
  403: errorResponse('Rota exclusiva do super admin (`FORBIDDEN_ROLE`)'),
};

const emailInUse = errorResponse('E-mail já vinculado a outra escola ou conta (`EMAIL_IN_USE`)');
const schoolNotFound = errorResponse('Escola não encontrada (`SCHOOL_NOT_FOUND`)');

const studentFields = {
  type: 'object',
  required: ['name', 'rm', 'age'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100, example: 'Maria Souza' },
    rm: { type: 'string', minLength: 1, maxLength: 8, pattern: '^[A-Za-z0-9]+$', example: '12345' },
    age: { type: 'integer', minimum: 1, maximum: 120, example: 16 },
    year: { allOf: [ref('SchoolYear')], nullable: true, description: 'Opcional (vazio = sem série)' },
    courseId: { type: 'integer', minimum: 1, nullable: true, example: 1, description: 'Opcional (vazio = sem curso)' },
    photo: { type: 'string', format: 'binary', description: 'Foto do aluno (JPEG, PNG, WebP ou BMP, até 2 MB)' },
  },
};

/** No cadastro a foto é obrigatória; na edição, só é enviada para trocar a atual. */
const createStudentForm = { ...studentFields, required: [...studentFields.required, 'photo'] };

const studentBadRequest = {
  description:
    'Dados inválidos (`VALIDATION_ERROR`), foto inválida (`UPLOAD_ERROR`), foto ausente (`PHOTO_REQUIRED`) ou curso inexistente (`INVALID_COURSE`)',
  content: json(ref('ValidationError')),
};

const rmInUse = errorResponse('Já existe um aluno com esse RM (`RM_IN_USE`)');
const courseExists = errorResponse('Já existe um curso com esse nome (`COURSE_EXISTS`)');

const accessLogsFilters = [
  { name: 'from', in: 'query', description: 'Início do período (ISO 8601)', schema: { type: 'string', format: 'date-time' } },
  { name: 'to', in: 'query', description: 'Fim do período (ISO 8601)', schema: { type: 'string', format: 'date-time' } },
  { name: 'search', in: 'query', description: 'Parte do nome do aluno', schema: { type: 'string', maxLength: 100 } },
];

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'HelpUs - Controle de Acesso',
    version: process.env.npm_package_version ?? '1.0.0',
    description: [
      'API REST do HelpUs: cadastro de cursos e alunos, digitais do leitor biométrico e registro de entradas.',
      '',
      '**Autenticação:** cadastro, login, ativação da conta e recuperação de senha são feitos pelo',
      'frontend direto no **Supabase Auth**. Para chamar as rotas protegidas, envie o `access_token`',
      'da sessão do Supabase no cabeçalho `Authorization: Bearer <token>` (botão **Authorize**).',
      'No primeiro acesso, o usuário e a escola dele são criados automaticamente (ou o usuário é vinculado',
      'à escola já cadastrada com o mesmo e-mail).',
      '',
      '**Perfis:** `SCHOOL` (login da escola) só enxerga os registros da própria escola; `SUPER_ADMIN` opera',
      'qualquer escola pelo cabeçalho `X-School-Id` e gerencia escolas e usuários.',
      '',
      '**Erros** seguem o formato `{ "code": "...", "message": "..." }`; erros de validação trazem também `issues`.',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'Este servidor' }],
  tags: [
    { name: 'Health', description: 'Situação da API e do banco' },
    { name: 'Auth', description: 'Instituição logada' },
    { name: 'Cursos', description: 'Cursos da instituição' },
    { name: 'Alunos', description: 'Alunos, fotos e digitais' },
    { name: 'Entradas', description: 'Registro e consulta das entradas dos alunos' },
    { name: 'Painel', description: 'Resumo exibido na tela inicial' },
    { name: 'Escolas', description: 'Gestão das escolas (super admin)' },
    { name: 'Usuários', description: 'Gestão de usuários e perfis (super admin)' },
  ],
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Verifica se a API e o banco estão no ar',
        security: [],
        responses: {
          200: { description: 'API e banco funcionando', content: json(ref('Health')) },
          503: { description: 'Banco indisponível (`status: degraded`)', content: json(ref('Health')) },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Dados do usuário logado (perfil e escola)',
        description: 'No primeiro acesso, cria o usuário e a escola (ou vincula a escola existente com o mesmo e-mail).',
        responses: {
          200: { description: 'Usuário logado', content: json(ref('Me')) },
          409: errorResponse('E-mail já vinculado a outra conta (`EMAIL_IN_USE`)'),
          ...authErrors,
        },
      },
    },
    '/api/courses': {
      get: {
        tags: ['Cursos'],
        summary: 'Lista os cursos (ordem alfabética)',
        responses: {
          200: {
            description: 'Cursos com a quantidade de alunos',
            content: json({ type: 'array', items: ref('CourseWithCount') }),
          },
          ...authErrors,
        },
      },
      post: {
        tags: ['Cursos'],
        summary: 'Cadastra um curso',
        requestBody: { required: true, content: json(ref('CourseInput')) },
        responses: {
          201: { description: 'Curso criado', content: json(ref('Course')) },
          400: validationError,
          409: courseExists,
          ...authErrors,
        },
      },
    },
    '/api/courses/{id}': {
      parameters: [idParam],
      put: {
        tags: ['Cursos'],
        summary: 'Renomeia um curso',
        requestBody: { required: true, content: json(ref('CourseInput')) },
        responses: {
          200: { description: 'Curso atualizado', content: json(ref('Course')) },
          400: validationError,
          404: notFound,
          409: courseExists,
          ...authErrors,
        },
      },
      delete: {
        tags: ['Cursos'],
        summary: 'Exclui um curso',
        responses: {
          204: { description: 'Curso excluído' },
          404: notFound,
          409: errorResponse('O curso tem alunos vinculados (`COURSE_HAS_STUDENTS`)'),
          ...authErrors,
        },
      },
    },
    '/api/students': {
      get: {
        tags: ['Alunos'],
        summary: 'Lista os alunos',
        parameters: [
          { name: 'search', in: 'query', description: 'Parte do nome ou do RM', schema: { type: 'string', maxLength: 100 } },
          { name: 'courseId', in: 'query', description: 'Filtra por curso', schema: { type: 'integer', minimum: 1 } },
        ],
        responses: {
          200: { description: 'Alunos encontrados', content: json({ type: 'array', items: ref('Student') }) },
          400: validationError,
          ...authErrors,
        },
      },
      post: {
        tags: ['Alunos'],
        summary: 'Cadastra um aluno com foto',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: createStudentForm } } },
        responses: {
          201: { description: 'Aluno criado', content: json(ref('Student')) },
          400: studentBadRequest,
          409: rmInUse,
          ...authErrors,
        },
      },
    },
    '/api/students/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Alunos'],
        summary: 'Busca um aluno',
        responses: {
          200: { description: 'Aluno', content: json(ref('Student')) },
          404: notFound,
          ...authErrors,
        },
      },
      put: {
        tags: ['Alunos'],
        summary: 'Atualiza um aluno',
        description: 'Envie `photo` apenas para trocar a foto; sem o campo, a foto atual é mantida.',
        requestBody: { required: true, content: { 'multipart/form-data': { schema: studentFields } } },
        responses: {
          200: { description: 'Aluno atualizado', content: json(ref('Student')) },
          400: studentBadRequest,
          404: notFound,
          409: rmInUse,
          ...authErrors,
        },
      },
      delete: {
        tags: ['Alunos'],
        summary: 'Exclui um aluno',
        description: 'As entradas já registradas são mantidas com o nome do aluno.',
        responses: {
          204: { description: 'Aluno excluído' },
          404: notFound,
          ...authErrors,
        },
      },
    },
    '/api/students/{id}/photo': {
      parameters: [idParam],
      get: {
        tags: ['Alunos'],
        summary: 'Foto do aluno',
        responses: {
          200: {
            description: 'Imagem no formato em que foi enviada',
            content: {
              'image/jpeg': { schema: { type: 'string', format: 'binary' } },
              'image/png': { schema: { type: 'string', format: 'binary' } },
              'image/webp': { schema: { type: 'string', format: 'binary' } },
              'image/bmp': { schema: { type: 'string', format: 'binary' } },
            },
          },
          404: errorResponse('Aluno ou foto não encontrados'),
          ...authErrors,
        },
      },
    },
    '/api/students/{id}/fingerprint': {
      parameters: [idParam],
      post: {
        tags: ['Alunos'],
        summary: 'Reserva uma posição no sensor para a digital',
        description:
          'Primeiro passo do cadastro da digital: devolve a posição livre no sensor. O frontend envia ' +
          '`!enroll<posição>#` ao Arduino e, quando o sensor confirma, chama `/fingerprint/confirm`.',
        responses: {
          200: { description: 'Posição reservada', content: json(ref('FingerprintSlot')) },
          404: notFound,
          409: errorResponse('Todas as posições do sensor estão ocupadas (`FINGERPRINT_FULL`)'),
          ...authErrors,
        },
      },
      delete: {
        tags: ['Alunos'],
        summary: 'Remove a digital do aluno',
        responses: {
          200: { description: 'Aluno sem digital', content: json(ref('Student')) },
          404: notFound,
          ...authErrors,
        },
      },
    },
    '/api/students/{id}/fingerprint/confirm': {
      parameters: [idParam],
      post: {
        tags: ['Alunos'],
        summary: 'Confirma que a digital foi gravada no sensor',
        responses: {
          200: { description: 'Digital cadastrada', content: json(ref('Student')) },
          400: errorResponse('Nenhuma posição reservada para o aluno (`BAD_REQUEST`)'),
          404: notFound,
          ...authErrors,
        },
      },
    },
    '/api/access-logs': {
      get: {
        tags: ['Entradas'],
        summary: 'Lista as entradas (mais recentes primeiro)',
        parameters: [
          ...accessLogsFilters,
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
        ],
        responses: {
          200: { description: 'Página de entradas', content: json(ref('AccessLogPage')) },
          400: validationError,
          ...authErrors,
        },
      },
    },
    '/api/access-logs/export': {
      get: {
        tags: ['Entradas'],
        summary: 'Exporta as entradas em CSV',
        description: 'Mesmos filtros da listagem. Arquivo `entradas.csv` separado por `;`, compatível com o Excel.',
        parameters: accessLogsFilters,
        responses: {
          200: {
            description: 'Arquivo CSV',
            headers: { 'Content-Disposition': { schema: { type: 'string', example: 'attachment; filename="entradas.csv"' } } },
            content: { 'text/csv': { schema: { type: 'string', example: 'Nome;Data/Hora (UTC);Método\n"Maria Souza";2026-11-02T11:30:00.000Z;Digital' } } },
          },
          400: validationError,
          ...authErrors,
        },
      },
    },
    '/api/access-logs/fingerprint': {
      post: {
        tags: ['Entradas'],
        summary: 'Registra a entrada pela digital',
        description: 'Chamado quando o Arduino responde `!found<posição>#` na tela de verificação.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['fingerprintId'],
            properties: { fingerprintId: { type: 'integer', minimum: 1, maximum: 1000, example: 3 } },
          }),
        },
        responses: {
          201: { description: 'Entrada registrada', content: json(ref('EntryResult')) },
          400: validationError,
          404: errorResponse('Digital não vinculada a nenhum aluno (`FINGERPRINT_NOT_FOUND`)'),
          ...authErrors,
        },
      },
    },
    '/api/access-logs/manual': {
      post: {
        tags: ['Entradas'],
        summary: 'Registra a entrada pelo RM',
        description: 'Contingência para quando o leitor biométrico não está disponível.',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['rm'],
            properties: { rm: { type: 'string', minLength: 1, maxLength: 8, example: '12345' } },
          }),
        },
        responses: {
          201: { description: 'Entrada registrada', content: json(ref('EntryResult')) },
          400: validationError,
          404: errorResponse('Nenhum aluno com esse RM (`STUDENT_NOT_FOUND`)'),
          ...authErrors,
        },
      },
    },
    '/api/stats': {
      get: {
        tags: ['Painel'],
        summary: 'Resumo da tela inicial',
        parameters: [
          {
            name: 'since',
            in: 'query',
            description: 'Início do dia no fuso do usuário, para contar as entradas de hoje (padrão: meia-noite no fuso do servidor)',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          200: { description: 'Resumo', content: json(ref('Stats')) },
          400: validationError,
          ...authErrors,
        },
      },
    },
    '/api/schools': {
      get: {
        tags: ['Escolas'],
        summary: 'Lista as escolas com contadores',
        responses: {
          200: { description: 'Escolas (ordem alfabética)', content: json({ type: 'array', items: ref('SchoolSummary') }) },
          ...superAdminErrors,
        },
      },
      post: {
        tags: ['Escolas'],
        summary: 'Cadastra uma escola',
        description: 'Quem se cadastrar depois com o mesmo e-mail é vinculado a ela como login da escola.',
        requestBody: { required: true, content: json(ref('SchoolInput')) },
        responses: {
          201: { description: 'Escola criada', content: json(ref('School')) },
          400: validationError,
          409: emailInUse,
          ...superAdminErrors,
        },
      },
    },
    '/api/schools/{id}': {
      parameters: [idParam],
      put: {
        tags: ['Escolas'],
        summary: 'Edita nome e e-mail de contato (não altera o login)',
        requestBody: { required: true, content: json(ref('SchoolInput')) },
        responses: {
          200: { description: 'Escola atualizada', content: json(ref('School')) },
          400: validationError,
          404: schoolNotFound,
          409: emailInUse,
          ...superAdminErrors,
        },
      },
      delete: {
        tags: ['Escolas'],
        summary: 'Exclui a escola com cursos, alunos, fotos e entradas',
        responses: {
          204: { description: 'Escola excluída' },
          404: schoolNotFound,
          ...superAdminErrors,
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Usuários'],
        summary: 'Lista os usuários (até 200, ordem alfabética)',
        parameters: [
          { name: 'search', in: 'query', description: 'Parte do nome ou do e-mail', schema: { type: 'string', maxLength: 100 } },
          { name: 'role', in: 'query', description: 'Filtra por perfil', schema: ref('UserRole') },
        ],
        responses: {
          200: { description: 'Usuários', content: json({ type: 'array', items: ref('UserSummary') }) },
          400: validationError,
          ...superAdminErrors,
        },
      },
    },
    '/api/users/{id}': {
      parameters: [idParam],
      patch: {
        tags: ['Usuários'],
        summary: 'Altera o perfil (login de escola ou super admin)',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            required: ['role'],
            properties: { role: { type: 'string', enum: ['SCHOOL', 'SUPER_ADMIN'] } },
          }),
        },
        responses: {
          200: { description: 'Usuário atualizado', content: json(ref('UserSummary')) },
          400: errorResponse('Dados inválidos (`VALIDATION_ERROR`) ou usuário sem escola para virar login de escola (`SCHOOL_REQUIRED`)'),
          404: errorResponse('Usuário não encontrado (`USER_NOT_FOUND`)'),
          409: errorResponse(
            'Rebaixar a si mesmo (`CANNOT_DEMOTE_SELF`), o último super admin (`LAST_SUPER_ADMIN`) ou escola que já tem login (`SCHOOL_HAS_LOGIN`)',
          ),
          ...superAdminErrors,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '`access_token` da sessão do Supabase Auth',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'NOT_FOUND' },
          message: { type: 'string', example: 'Aluno não encontrado' },
        },
      },
      ValidationError: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Dados inválidos' },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: { type: 'string', example: 'name' },
                message: { type: 'string', example: 'Informe o nome' },
              },
            },
          },
        },
      },
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          database: { type: 'string', enum: ['up', 'down'] },
          version: { type: 'string', example: '1.0.0' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      School: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'ETEC Exemplo' },
          email: { type: 'string', format: 'email', example: 'secretaria@exemplo.com' },
        },
      },
      SchoolInput: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', maxLength: 100, example: 'ETEC Exemplo' },
          email: { type: 'string', format: 'email', maxLength: 120, example: 'secretaria@exemplo.com' },
        },
      },
      SchoolSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'ETEC Exemplo' },
          email: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          counts: {
            type: 'object',
            properties: { students: { type: 'integer' }, courses: { type: 'integer' }, accessLogs: { type: 'integer' } },
          },
          hasLogin: { type: 'boolean', description: 'Se a escola já tem login de escola (SCHOOL) vinculado' },
        },
      },
      UserRole: { type: 'string', enum: ['SUPER_ADMIN', 'SCHOOL', 'STUDENT', 'EMPLOYEE', 'TEACHER'] },
      UserSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'ETEC Exemplo' },
          email: { type: 'string', format: 'email' },
          role: ref('UserRole'),
          school: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Me: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'ETEC Exemplo' },
          email: { type: 'string', format: 'email' },
          role: ref('UserRole'),
          school: { type: 'object', nullable: true, properties: { id: { type: 'integer' }, name: { type: 'string' } } },
        },
      },
      CourseInput: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string', minLength: 1, maxLength: 60, example: 'Informática' } },
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Informática' },
          schoolId: { type: 'integer', example: 1 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CourseWithCount: {
        allOf: [
          ref('Course'),
          { type: 'object', properties: { studentsCount: { type: 'integer', example: 32 } } },
        ],
      },
      SchoolYear: {
        type: 'string',
        enum: ['FIRST', 'SECOND', 'THIRD'],
        description: 'Série: 1º, 2º ou 3º ano',
      },
      Student: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Maria Souza' },
          rm: { type: 'string', example: '12345' },
          age: { type: 'integer', example: 16 },
          year: { allOf: [ref('SchoolYear')], nullable: true },
          course: {
            type: 'object',
            nullable: true,
            properties: { id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Informática' } },
          },
          hasPhoto: { type: 'boolean' },
          fingerprintId: { type: 'integer', nullable: true, description: 'Posição da digital no sensor', example: 3 },
          fingerprintEnrolled: { type: 'boolean', description: 'Se a digital já foi gravada no sensor' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      FingerprintSlot: {
        type: 'object',
        properties: { fingerprintId: { type: 'integer', example: 3 } },
      },
      AccessLog: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          schoolId: { type: 'integer', example: 1 },
          studentId: { type: 'integer', nullable: true, description: 'Nulo se o aluno foi excluído', example: 1 },
          studentName: { type: 'string', example: 'Maria Souza' },
          method: { type: 'string', enum: ['FINGERPRINT', 'MANUAL'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AccessLogPage: {
        type: 'object',
        properties: {
          items: { type: 'array', items: ref('AccessLog') },
          total: { type: 'integer', example: 120 },
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 20 },
        },
      },
      EntryResult: {
        type: 'object',
        properties: { log: ref('AccessLog'), student: ref('Student') },
      },
      Stats: {
        type: 'object',
        properties: {
          students: { type: 'integer', example: 120 },
          courses: { type: 'integer', example: 4 },
          entriesToday: { type: 'integer', example: 87 },
          pendingFingerprints: { type: 'integer', description: 'Alunos sem digital cadastrada', example: 5 },
          recentEntries: { type: 'array', items: ref('AccessLog'), description: 'Últimas 5 entradas' },
        },
      },
    },
  },
};

// Rotas por escola aceitam o cabeçalho X-School-Id e seus erros de escopo.
for (const [path, item] of Object.entries(openApiSpec.paths) as [string, Record<string, unknown>][]) {
  if (!/^\/api\/(courses|students|access-logs|stats)/.test(path)) continue;
  item.parameters = [...((item.parameters as object[] | undefined) ?? []), schoolHeader];
  for (const operation of Object.values(item)) {
    if (operation && typeof operation === 'object' && 'responses' in operation) {
      const responses = (operation as { responses: Record<string, unknown> }).responses;
      for (const [status, response] of Object.entries(scopeErrors)) responses[status] ??= response;
    }
  }
}
