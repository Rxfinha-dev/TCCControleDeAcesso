/** Trecho do OpenAPI dos logins de professores e alunos e da troca de senha. */

interface DocHelpers {
  ref: (name: string) => object;
  json: (schema: object) => object;
  errorResponse: (description: string) => object;
  authErrors: Record<string, object>;
  validationError: object;
  notFound: object;
  idParam: object;
}

const TAG = 'Logins';
const password = { type: 'string', minLength: 8, maxLength: 72, example: 'senha1234' };

export const loginsTags = [
  {
    name: TAG,
    description:
      'Logins de professores ("nome.sobrenome@código") e alunos ("RM@código") criados pela escola. ' +
      'A senha inicial só aparece na resposta e precisa ser trocada no primeiro acesso.',
  },
];

export function loginsPaths({ ref, json, errorResponse, authErrors, validationError, notFound, idParam }: DocHelpers) {
  const noCode = errorResponse('Senha inválida ou escola sem código definido em Configurações (`SCHOOL_CODE_REQUIRED`)');
  const unavailable = errorResponse('API sem SUPABASE_SERVICE_ROLE_KEY (`LOGINS_UNAVAILABLE`) ou Supabase fora do ar');
  const setLogin = (who: string) => ({
    put: {
      tags: [TAG],
      summary: `Cria o login do ${who} ou, se já existir, define uma nova senha`,
      description:
        'Sem `password`, o sistema gera uma senha de 8 caracteres. Nos dois casos o usuário troca a senha no próximo acesso. ' +
        'Gerar nova senha encerra todas as sessões abertas desse login.',
      parameters: [idParam],
      requestBody: { content: json({ type: 'object', properties: { password } }) },
      responses: {
        200: { description: 'Usuário e senha (mostrados só agora)', content: json(ref('LoginCredentials')) },
        400: noCode,
        404: notFound,
        409: errorResponse('Usuário já existe (`USERNAME_TAKEN`)'),
        503: unavailable,
        ...authErrors,
      },
    },
  });
  return {
    '/api/logins/teachers/{id}': setLogin('professor'),
    '/api/logins/students/{id}': setLogin('aluno'),
    '/api/logins/class-groups/{id}': {
      post: {
        tags: [TAG],
        summary: 'Gera os logins dos alunos da turma que ainda não têm',
        description:
          'Cada aluno é criado por inteiro ou não é criado. Quem falhou aparece em `failed`; gerar de novo cria só os que faltam.',
        parameters: [idParam],
        responses: {
          200: {
            description: 'Lista para imprimir',
            content: json({
              type: 'object',
              properties: {
                created: {
                  type: 'array',
                  items: {
                    allOf: [
                      ref('LoginCredentials'),
                      { type: 'object', properties: { studentId: { type: 'integer' }, name: { type: 'string' }, rm: { type: 'string' } } },
                    ],
                  },
                },
                failed: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { studentId: { type: 'integer' }, name: { type: 'string' }, rm: { type: 'string' }, reason: { type: 'string' } },
                  },
                },
              },
            }),
          },
          400: noCode,
          404: notFound,
          503: unavailable,
          ...authErrors,
        },
      },
    },
    '/api/auth/password': {
      put: {
        tags: ['Auth'],
        summary: 'Professor ou aluno troca a própria senha',
        description:
          'Obrigatório no primeiro acesso: até lá as outras rotas respondem `PASSWORD_CHANGE_REQUIRED`. ' +
          'Escola e super admin recebem 403 (`PASSWORD_CHANGE_NOT_ALLOWED`): trocam a senha pelo Supabase, com código por e-mail.',
        requestBody: { required: true, content: json({ type: 'object', required: ['password'], properties: { password } }) },
        responses: { 204: { description: 'Senha trocada' }, 400: validationError, ...authErrors },
      },
    },
  };
}

export const loginsSchemas = {
  LoginCredentials: {
    type: 'object',
    properties: {
      username: { type: 'string', example: 'ana.prado@etec-jau' },
      password: { type: 'string', example: 'k7pmx3qa' },
    },
  },
};
