# Deploy do HelpUs (ambiente de testes)

Arquitetura de produção:

```
 Navegador (Chrome/Edge + Arduino via USB)
        │
        ▼
 helpus-web  ── Render (site estático, gratuito) ── React/Vite
        │  login, cadastro e códigos ──────────────▶ Supabase Auth
        │  HTTPS (VITE_API_URL) + token do Supabase
        ▼
 helpus-api  ── Render (Docker, gratuito) ── Node.js + Express + Prisma
        │  valida o token (JWKS do Supabase Auth)
        ▼
 Supabase ── PostgreSQL (dados) + Storage (fotos dos alunos)
```

## Por que Supabase + Render?

O Supabase hospeda **banco PostgreSQL, Storage, Auth e Edge Functions** (estas rodam em Deno).
Ele **não** hospeda servidores Node.js/Express nem sites estáticos React. Por isso:

| Parte | Onde roda | Custo |
| --- | --- | --- |
| Banco de dados PostgreSQL | **Supabase** | Free tier |
| Login, cadastro e códigos por e-mail | **Supabase Auth** | Free tier |
| Fotos dos alunos | **Supabase Storage** (bucket privado, criado automaticamente) | Free tier |
| API Node.js | **Render** (container Docker) | Free tier |
| Frontend React | **Render** (static site) | Free tier |

> A API é um container Docker comum: se preferir, ela roda sem alterações no Railway, Fly.io (região `gru`, São Paulo) ou em qualquer VPS.

---

## 1. Supabase (banco, auth e storage)

1. Crie uma conta em <https://supabase.com> e um projeto novo.
   - **Region:** `East US (North Virginia)` — a mesma região da API no Render, para baixa latência.
   - Guarde a senha do banco.
2. Clique em **Connect** (topo do dashboard) e copie as duas connection strings:
   - **Transaction pooler** (porta `6543`) → será o `DATABASE_URL`. Acrescente `?pgbouncer=true&connection_limit=1` no final.
   - **Session pooler** (porta `5432`) → será o `DIRECT_URL` (usado só para migrations).

   ```
   DATABASE_URL=postgresql://postgres.<ref>:<senha>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres.<ref>:<senha>@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

   > Use o *session pooler* e não a "Direct connection" (`db.<ref>.supabase.co`): a conexão direta é apenas IPv6 e os runners do GitHub Actions não têm IPv6.
3. Em **Project Settings → API Keys** copie:
   - **Project URL** → `SUPABASE_URL` (API) e `VITE_SUPABASE_URL` (frontend)
   - **Publishable key** (`sb_publishable_...`, ou a `anon` legada) → `SUPABASE_PUBLISHABLE_KEY` (API) e `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend)
   - **Secret key / service_role** → `SUPABASE_SERVICE_ROLE_KEY` (só na API, para o Storage; nunca exponha essa chave no frontend).
4. Em **Project Settings → JWT Keys**, confirme que o projeto usa uma chave de assinatura assimétrica (padrão nos projetos novos). Assim a API valida os tokens localmente, sem consultar o Supabase a cada requisição.

As migrations habilitam **Row Level Security** em todas as tabelas, sem políticas. Assim, a API REST automática do Supabase (chave `anon`) não consegue ler nada; todo acesso passa pela nossa API.

## 2. Supabase Auth (login e códigos por e-mail)

O cadastro, a ativação da conta e a recuperação de senha são feitos pelo **Supabase Auth**. A API não guarda senhas: no primeiro login ela cria a instituição (com o nome informado no cadastro) ou vincula pelo e-mail uma instituição que já existia no banco.

Em **Authentication** no dashboard:

1. **Sign In / Providers → Email**
   - **Confirm email**: ligado. ⚠️ Sem confirmação, qualquer pessoa poderia se cadastrar com o e-mail de uma instituição existente e assumir os dados dela.
   - **Minimum password length**: `9` (mesma regra do sistema legado).
   - **Email OTP expiration**: `900` segundos (15 minutos, como no legado).
   - **Email OTP length**: `6` (as telas pedem um código de 6 dígitos).
2. **Emails → Templates**: o HelpUs usa o **código** de 6 dígitos (`{{ .Token }}`) no lugar do link. Edite:
   - **Confirm signup**:
     ```html
     <h2>Ativação da conta HelpUs</h2>
     <p>Seu código de ativação é: <strong>{{ .Token }}</strong></p>
     <p>O código expira em 15 minutos.</p>
     ```
   - **Reset Password**:
     ```html
     <h2>Recuperação de senha HelpUs</h2>
     <p>Seu código de verificação é: <strong>{{ .Token }}</strong></p>
     <p>Se você não pediu a troca de senha, ignore este e-mail.</p>
     ```
3. **Emails → SMTP Settings**: configure um SMTP próprio. O SMTP padrão do Supabase só envia para os membros da organização, tem limite baixo de envios e, em projetos gratuitos novos, não permite editar os templates acima. Opções gratuitas: **Resend**, **Brevo** ou Gmail com *Senha de app*.
4. **URL Configuration → Site URL**: a URL do frontend (ex.: `https://helpus-web.onrender.com`).

> ⚠️ O sistema legado tinha uma senha de app do Gmail escrita no código (`frmCadastroEmpresa.cs` e `frmNovaSenha.cs`), que continua no histórico do Git. **Revogue essa senha** na conta Google e, se usar Gmail, gere uma nova apenas para o SMTP do Supabase.

### Contas do sistema anterior

As senhas antigas não são migradas (o Supabase Auth não importa os hashes do HelpUs). Quem já tinha conta deve se cadastrar de novo com o **mesmo e-mail**: depois de confirmar o código, a API vincula automaticamente a instituição existente, com todos os cursos, alunos e entradas.

## 3. Render (API + frontend)

1. Crie uma conta em <https://render.com> e conecte o GitHub.
2. **New → Blueprint** e selecione este repositório. O Render lê o `render.yaml` da raiz e cria:
   - `helpus-api` (Docker)
   - `helpus-web` (static site)
3. Preencha as variáveis pedidas:

   **helpus-api**

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | Transaction pooler do Supabase (com `?pgbouncer=true&connection_limit=1`) |
   | `CORS_ORIGIN` | URL do frontend, ex.: `https://helpus-web.onrender.com` |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Secret key / service_role |
   | `SUPER_ADMIN_BOOTSTRAP_EMAIL` | Opcional. E-mail que nasce super admin no primeiro login (padrão: e-mail do dono do projeto) |

   **helpus-web**

   | Variável | Valor |
   | --- | --- |
   | `VITE_API_URL` | URL da API + `/api`, ex.: `https://helpus-api.onrender.com/api` |
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key |

4. Em cada serviço, abra **Settings → Deploy Hook** e copie a URL (será usada no GitHub).

> No plano gratuito a API "dorme" após 15 minutos sem uso e leva ~1 minuto para acordar. O Supabase gratuito pausa projetos após 7 dias sem atividade.

## 4. GitHub (CI/CD)

Em **Settings → Environments** crie o environment `production` (opcional: exija aprovação manual) e cadastre:

**Secrets**

| Secret | Valor |
| --- | --- |
| `SUPABASE_DATABASE_URL` | Mesmo `DATABASE_URL` da API |
| `SUPABASE_DIRECT_URL` | Session pooler (porta 5432) |
| `RENDER_API_DEPLOY_HOOK` | Deploy hook do `helpus-api` |
| `RENDER_WEB_DEPLOY_HOOK` | Deploy hook do `helpus-web` |

**Variables**

| Variable | Valor |
| --- | --- |
| `API_URL` | `https://helpus-api.onrender.com` (sem `/api`) |
| `WEB_URL` | `https://helpus-web.onrender.com` |

Em **Settings → Branches**, proteja `main` e `develop` exigindo os checks do workflow **CI**.

### Workflows

| Workflow | Quando roda | O que faz |
| --- | --- | --- |
| `ci.yml` | PRs para `develop`/`main` e push em `develop` | Lint, typecheck, testes (Jest), migrations num PostgreSQL limpo, build e imagem Docker |
| `deploy.yml` | Push em `main` (ou manual) | `prisma migrate deploy` no Supabase → deploy hooks do Render → smoke test em `/api/health` |
| `release.yml` | Tag `v*.*.*` | Testes, publica a imagem da API no GHCR e cria a Release com o build do frontend |
| `codeql.yml` | PRs, pushes e semanalmente | Análise de segurança do código |
| `dependabot.yml` | Semanal/mensal | PRs de atualização de dependências contra `develop` |

### Fluxo de branches

```
feature/*  ──PR──▶  develop  ──PR──▶  main  ──(deploy.yml)──▶  produção
                                       └── git tag v1.0.0 ──▶ release.yml
```

## 5. Primeiro acesso

1. Faça merge em `main` (ou rode **Actions → Deploy → Run workflow**).
2. Acesse a URL do frontend, clique em **Cadastre-se → Sou uma escola**, informe o código recebido por e-mail e pronto.
   - O e-mail de `SUPER_ADMIN_BOOTSTRAP_EMAIL` entra como **super admin** (a migration `users_roles` também promove esse e-mail se ele já tinha login).
   - Novos super admins são promovidos pela tela **Usuários**; escolas podem ser criadas pela tela **Escolas** e são vinculadas quando alguém se cadastra com o e-mail informado.
3. Opcional: popular dados de demonstração a partir da sua máquina:

   ```bash
   cd AccessControl/apps/api
   DATABASE_URL="<session pooler>" DIRECT_URL="<session pooler>" \
   SUPABASE_URL="<project url>" SUPABASE_SERVICE_ROLE_KEY="<secret key>" \
   SEED_PASSWORD="umaSenhaForte123" npm run prisma:seed
   ```

   Com a secret key, o seed também cria o usuário `demo@helpus.app` (já confirmado) no Supabase Auth.

## 6. Leitor biométrico

O Arduino é conectado no computador da portaria e acessado pelo navegador via **Web Serial** (Chrome ou Edge, desktop). Em **Configurações → Conectar**, escolha a porta do Arduino. O protocolo é o mesmo do sistema legado (`!enroll<n>#`, `!verify#`, `!a#`, `!found<n>#`...), então o firmware atual continua funcionando.
