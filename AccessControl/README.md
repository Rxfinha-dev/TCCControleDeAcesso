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
| `frmLogin` | Login com e-mail e senha (bcrypt + JWT), mostrar/ocultar senha |
| `frmCadastroEmpresa` + `frmAtivacaoConta` | Cadastro da instituição com código de ativação de 6 dígitos por e-mail (expira em 15 min, máx. 5 tentativas, reenvio) |
| `frmNovaSenha` + `frmTrocandoSenha` | Recuperação de senha por código enviado por e-mail |
| `frmMainMenu` | Menu lateral escuro + painel inicial com indicadores |
| `frmListaAlunos` | CRUD de alunos com foto, busca, curso e série; cadastro da digital no sensor |
| `frmCadastroCurso` | CRUD de cursos (impede excluir curso com alunos) |
| `frmVerificacao` | Verificação contínua pela digital, exibe foto e dados e registra a entrada; entrada manual por RM como contingência |
| `frmLog` | Relatório de entradas com filtros por período/nome, paginação e exportação CSV |
| `frmConfiguracoes` | Conexão com o Arduino pelo navegador (Web Serial) |

Melhorias de segurança em relação ao legado: credenciais apenas em variáveis de ambiente, códigos gerados com `crypto.randomInt` e guardados como hash, rate limit nas rotas de autenticação, isolamento dos dados por instituição em todas as consultas, RLS habilitado no Supabase e validação de entrada com Zod.

## Estrutura

```
AccessControl/
├── apps/
│   ├── api/                  # API REST (Express + Prisma)
│   │   ├── prisma/           # schema, migrations e seed
│   │   ├── src/
│   │   │   ├── config/       # variáveis de ambiente validadas
│   │   │   ├── middlewares/  # auth JWT, erros, upload, rate limit
│   │   │   ├── modules/      # auth, courses, students, access-logs, stats
│   │   │   └── services/     # e-mail, storage de fotos, tokens, códigos
│   │   └── tests/            # Jest + Supertest
│   └── web/                  # Frontend React
│       ├── src/
│       │   ├── api/          # cliente HTTP tipado
│       │   ├── components/   # layout, logo, componentes de UI
│       │   ├── contexts/     # autenticação, Arduino (serial), notificações
│       │   ├── pages/        # telas
│       │   └── serial/       # protocolo e conexão Web Serial com o Arduino
│       └── tests/            # Jest + Testing Library
├── docker-compose.yml        # PostgreSQL local (+ API opcional)
└── DEPLOY.md                 # guia de publicação (Supabase + Render + GitHub)
```

## Rodando localmente

Pré-requisitos: **Node.js 20.19+** (com npm 10+) e **Docker** (para o PostgreSQL) — ou um projeto Supabase.

```bash
cd AccessControl

# 1. Dependências
npm install

# 2. Banco de dados local
docker compose up -d db

# 3. Variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Tabelas + dados de demonstração
npm run db:migrate
npm run db:seed          # login: demo@helpus.app / helpus-demo-123

# 5. API (http://localhost:3333) + frontend (http://localhost:5173)
npm run dev
```

Sem SMTP configurado, os códigos de ativação/recuperação aparecem no terminal da API.

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

Prefixo `/api`. Todas as rotas, exceto `/auth/*` e `/health`, exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Status da API e do banco |
| POST | `/auth/register` | Cadastra instituição e envia código de ativação |
| POST | `/auth/verify-email` | Ativa a conta com o código (retorna sessão) |
| POST | `/auth/resend-verification` | Reenvia o código de ativação |
| POST | `/auth/login` | Login (retorna JWT) |
| POST | `/auth/forgot-password` | Envia código de recuperação |
| POST | `/auth/reset-password` | Define nova senha com o código |
| GET | `/auth/me` | Instituição autenticada |
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
