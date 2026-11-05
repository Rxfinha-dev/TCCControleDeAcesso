# HelpUs — Controle de Acesso

> Segurança que conecta.

Sistema web de controle de acesso de alunos com leitura biométrica (Arduino + sensor de digitais).
É a reescrita do sistema desktop WinForms do TCC (pasta `TCCControleDeAcesso/`) para uma stack web moderna.

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript + React Router |
| Backend | Node.js + Express 5 + TypeScript |
| Banco | PostgreSQL (Supabase em produção) |
| ORM | Prisma |
| Testes | Jest (+ Supertest na API, Testing Library no frontend) |
| Hardware | Arduino via Web Serial API (Chrome/Edge) |
| CI/CD | GitHub Actions → Supabase + Render |

## Funcionalidades

Tudo o que existia no sistema legado, atualizado:

| Legado (WinForms) | Novo |
| --- | --- |
| `frmLogin` | Login com e-mail e senha pelo Supabase Auth, mostrar/ocultar senha |
| `frmCadastroEmpresa` + `frmAtivacaoConta` | Cadastro da instituição com código de ativação de 6 dígitos enviado pelo Supabase Auth (com reenvio) |
| `frmNovaSenha` + `frmTrocandoSenha` | Recuperação de senha por código enviado por e-mail; a troca encerra as outras sessões |
| `frmMainMenu` | Menu lateral escuro + painel inicial com indicadores |
| `frmListaAlunos` | CRUD de alunos com foto, busca, curso e série; cadastro da digital no sensor |
| `frmCadastroCurso` | CRUD de cursos (impede excluir curso com alunos) |
| `frmVerificacao` | Verificação contínua pela digital, exibe foto e dados e registra a entrada; entrada manual por RM como contingência |
| `frmLog` | Relatório de entradas com filtros por período/nome, paginação e exportação CSV |
| `frmConfiguracoes` | Conexão com o Arduino pelo navegador (Web Serial) |

Melhorias de segurança em relação ao legado: credenciais apenas em variáveis de ambiente, senhas e códigos por e-mail gerenciados pelo Supabase Auth (a API não guarda senhas, valida os tokens pela JWKS do projeto e recusa tokens de sessões encerradas no logout ou na troca de senha), rate limit nas rotas da API, isolamento dos dados por instituição em todas as consultas, RLS habilitado e acesso da Data API (anon/authenticated) revogado no Supabase e validação de entrada com Zod.

## Estrutura

```
AccessControl/
├── apps/
│   ├── api/                  # API REST (Express + Prisma)
│   │   ├── prisma/           # schema, migrations e seed
│   │   ├── src/
│   │   │   ├── config/       # variáveis de ambiente validadas
│   │   │   ├── middlewares/  # auth (token do Supabase), erros, upload, rate limit
│   │   │   ├── modules/      # auth, courses, students, access-logs, stats
│   │   │   └── services/     # validação do login (Supabase Auth), storage de fotos
│   │   └── tests/            # Jest + Supertest
│   └── web/                  # Frontend React
│       ├── src/
│       │   ├── api/          # cliente HTTP tipado e login (Supabase Auth)
│       │   ├── components/   # layout, logo, componentes de UI
│       │   ├── contexts/     # autenticação, Arduino (serial), notificações
│       │   ├── pages/        # telas
│       │   └── serial/       # protocolo e conexão Web Serial com o Arduino
│       └── tests/            # Jest + Testing Library
├── docker-compose.yml        # PostgreSQL local (+ API opcional)
└── DEPLOY.md                 # guia de publicação (Supabase + Render + GitHub)
```

## Rodando localmente

Pré-requisitos: **Node.js 22+** (com npm 10+), **Docker** (para o PostgreSQL) e um **projeto Supabase** para o login (o plano gratuito serve; veja a seção 2 do [DEPLOY.md](DEPLOY.md)).

```bash
cd AccessControl

# 1. Dependências
npm install

# 2. Banco de dados local
docker compose up -d db

# 3. Variáveis de ambiente (preencha as chaves do Supabase nos dois arquivos)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Tabelas + dados de demonstração
npm run db:migrate
npm run db:seed          # login: demo@helpus.app / helpus-demo-123 (exige SUPABASE_SERVICE_ROLE_KEY)

# 5. API (http://localhost:3333) + frontend (http://localhost:5173)
npm run dev
```

Os códigos de ativação e recuperação de senha são enviados pelo Supabase Auth. Sem SMTP próprio, o Supabase só envia e-mails para os membros da organização do projeto; para testar com outros e-mails, configure um SMTP (veja o DEPLOY.md).

## Scripts

| Comando (em `AccessControl/`) | Descrição |
| --- | --- |
| `npm run dev` | API e frontend em modo desenvolvimento |
| `npm test` | Testes (Jest) dos dois projetos |
| `npm run lint` / `npm run typecheck` | Qualidade de código |
| `npm run build` | Build de produção |
| `npm run db:migrate` | Cria/aplica migrations (`prisma migrate dev`) |
| `npm run db:seed` | Dados de demonstração |

## API

Prefixo `/api`. Todas as rotas, exceto `/health`, exigem `Authorization: Bearer <access token do Supabase Auth>`.

A documentação completa (Swagger UI) fica em **`/docs`** — por exemplo, http://localhost:3333/docs em desenvolvimento — e a especificação OpenAPI em `/docs.json`. Pelo botão **Authorize** dá para informar o token e testar as rotas direto no navegador.
Cadastro, login, ativação e recuperação de senha são feitos pelo frontend direto no Supabase Auth.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Status da API e do banco |
| GET | `/auth/me` | Instituição do usuário logado (criada ou vinculada pelo e-mail no primeiro acesso) |
| GET/POST | `/courses` | Lista / cria cursos |
| PUT/DELETE | `/courses/:id` | Edita / exclui curso |
| GET/POST | `/students` | Lista (`?search=`) / cria aluno (multipart com `photo`) |
| GET/PUT/DELETE | `/students/:id` | Detalha / edita / exclui aluno |
| GET | `/students/:id/photo` | Foto do aluno |
| POST | `/students/:id/fingerprint` | Reserva posição no sensor biométrico |
| POST | `/students/:id/fingerprint/confirm` | Confirma digital cadastrada |
| DELETE | `/students/:id/fingerprint` | Remove vínculo da digital |
| GET | `/access-logs` | Entradas (`from`, `to`, `search`, `page`, `pageSize`) |
| GET | `/access-logs/export` | Exporta CSV |
| POST | `/access-logs/fingerprint` | Registra entrada pela digital (`fingerprintId`) |
| POST | `/access-logs/manual` | Registra entrada pelo RM |
| GET | `/stats` | Indicadores do painel |

## Arduino

O firmware do sistema legado continua compatível. Comandos enviados: `!empty#` (reset), `!enroll<n>#` (cadastrar digital na posição *n*), `!verify#` (iniciar verificação), `!a#` (parar). Mensagens recebidas: `!placeFinger#`, `!imageTaken#`, `!removeFinger#`, `!enrolled<n>#`, `Fingerprints did not match`, `!found<n>#`.

A posição *n* no sensor (1–127) é reservada pela API por instituição — não é mais o ID do aluno no banco.

## Deploy

Veja [DEPLOY.md](DEPLOY.md).
