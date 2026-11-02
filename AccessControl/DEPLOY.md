# Deploy do HelpUs (ambiente de testes)

Arquitetura de produção:

```
 Navegador (Chrome/Edge + Arduino via USB)
        │
        ▼
 helpus-web  ── Render (site estático, gratuito) ── React/Vite
        │  HTTPS (VITE_API_URL)
        ▼
 helpus-api  ── Render (Docker, gratuito) ── Node.js + Express + Prisma
        │
        ▼
 Supabase ── PostgreSQL (dados) + Storage (fotos dos alunos)
```

## Por que Supabase + Render?

O Supabase hospeda **banco PostgreSQL, Storage, Auth e Edge Functions** (estas rodam em Deno).
Ele **não** hospeda servidores Node.js/Express nem sites estáticos React. Por isso:

| Parte | Onde roda | Custo |
| --- | --- | --- |
| Banco de dados PostgreSQL | **Supabase** | Free tier |
| Fotos dos alunos | **Supabase Storage** (bucket privado, criado automaticamente) | Free tier |
| API Node.js | **Render** (container Docker) | Free tier |
| Frontend React | **Render** (static site) | Free tier |

> A API é um container Docker comum: se preferir, ela roda sem alterações no Railway, Fly.io (região `gru`, São Paulo) ou em qualquer VPS.

---

## 1. Supabase (banco e storage)

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
   - **Project URL** → `SUPABASE_URL`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY` (nunca exponha essa chave no frontend).

As migrations habilitam **Row Level Security** em todas as tabelas, sem políticas. Assim, a API REST automática do Supabase (chave `anon`) não consegue ler nada; todo acesso passa pela nossa API.

## 2. E-mail (códigos de ativação e recuperação de senha)

Qualquer SMTP funciona. Opções gratuitas:

- **Gmail**: ative a verificação em duas etapas e gere uma *Senha de app*. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`.
- **Resend** / **Brevo**: crie uma conta e use as credenciais SMTP fornecidas.

> ⚠️ O sistema legado tinha uma senha de app do Gmail escrita no código (`frmCadastroEmpresa.cs` e `frmNovaSenha.cs`), que continua no histórico do Git. **Revogue essa senha** na conta Google e gere uma nova apenas como variável de ambiente.

Sem `SMTP_HOST` a API não envia e-mails: os códigos aparecem apenas no log (útil em desenvolvimento).

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
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role / secret key |
   | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Dados do seu SMTP |

   `JWT_SECRET` é gerado automaticamente pelo Render.

   **helpus-web**

   | Variável | Valor |
   | --- | --- |
   | `VITE_API_URL` | URL da API + `/api`, ex.: `https://helpus-api.onrender.com/api` |

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
2. Acesse a URL do frontend, clique em **Cadastre-se**, informe o código recebido por e-mail e pronto.
3. Opcional: popular dados de demonstração a partir da sua máquina:

   ```bash
   cd AccessControl/apps/api
   DATABASE_URL="<session pooler>" DIRECT_URL="<session pooler>" SEED_PASSWORD="umaSenhaForte123" npm run prisma:seed
   ```

## 6. Leitor biométrico

O Arduino é conectado no computador da portaria e acessado pelo navegador via **Web Serial** (Chrome ou Edge, desktop). Em **Configurações → Conectar**, escolha a porta do Arduino. O protocolo é o mesmo do sistema legado (`!enroll<n>#`, `!verify#`, `!a#`, `!found<n>#`...), então o firmware atual continua funcionando.
