# Permissões por usuário — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o login "escola = conta" por usuários com perfil (`SUPER_ADMIN`, `SCHOOL`, futuros), com Super Admin operando qualquer escola via seletor, telas de Escolas e Usuários, e cadastro com "Sou uma escola / Sou um usuário (em breve)".

**Architecture:** Nova tabela `users` (Prisma) ligada ao Supabase Auth. `requireAuth` resolve o usuário; um middleware `requireSchoolScope` resolve a escola em uso a partir do cabeçalho `X-School-Id` e mantém `currentSchool(res).sub` para os serviços atuais. No web, `AuthContext` expõe o usuário e um `SchoolScopeContext` guarda a escola selecionada e injeta o cabeçalho.

**Tech Stack:** Express 5, Prisma 6.19.3, Zod 4, Jest + supertest + jest-mock-extended (api); React 19, react-router 7, Jest + Testing Library (web).

**Spec:** `docs/superpowers/specs/2026-11-07-permissoes-usuarios-design.md`

## Global Constraints

- Perfil vive **só** na tabela `users`; nunca ler perfil de `user_metadata`.
- E-mail do bootstrap: `SUPER_ADMIN_BOOTSTRAP_EMAIL`, default `rafaelhenriqueoliveira1234@gmail.com`, comparado em minúsculas.
- Cabeçalho de escola: `X-School-Id` (valor inteiro ou `all`).
- `SCHOOL` com `X-School-Id` de outra escola → 403 `SCHOOL_FORBIDDEN`.
- `all` só em `GET /api/access-logs`, `GET /api/access-logs/export`, `GET /api/stats`; nas demais → 400 `SCHOOL_REQUIRED`.
- Perfis `STUDENT`/`EMPLOYEE`/`TEACHER` → 403 `NO_PANEL_ACCESS` em todas as rotas do painel (inclusive `/me` funciona, para o web mostrar a mensagem).
- Um `SCHOOL` por escola: índice único parcial `users_school_role_key ON users(school_id) WHERE role = 'SCHOOL'`.
- Textos de UI e mensagens de erro em português, no tom das existentes.
- Comentários de código em português (padrão do repo).
- Nenhum comando contra o banco de produção (Supabase) sem confirmação explícita do usuário.

## Review Focus

1. Super Admin troca de escola no seletor enquanto uma tela tem requisição em andamento → a resposta antiga não pode sobrescrever a nova (telas recarregam com chave da escola). Teste em Task 8.
2. `X-School-Id` inválido (`abc`, `0`, `-1`, `1.5`) → 400 `INVALID_SCHOOL_ID`, nunca 500. Teste em Task 2.
3. Escola selecionada salva no `localStorage` foi excluída → web volta para a escola padrão (ou primeira da lista) sem quebrar. Teste em Task 8.
4. Super Admin rebaixado em outra aba/sessão → próxima requisição com `X-School-Id` de escola alheia vira 403 e o web recarrega `/me`. Teste em Task 2 (API) e tratamento em Task 7.
5. Exclusão de escola com falha no storage de fotos → exclusão no banco ainda acontece e retorna 204. Teste em Task 4.

---

## File Structure

**API (`AccessControl/apps/api`)**
- `prisma/schema.prisma` — enum `UserRole`, model `User`, `School` sem `authUserId`.
- `prisma/migrations/20261108000000_users_roles/migration.sql` — criação + migração de dados.
- `src/config/env.ts` — `SUPER_ADMIN_BOOTSTRAP_EMAIL`.
- `src/modules/auth/auth.service.ts` — autenticação/provisionamento por `User`.
- `src/middlewares/auth.ts` — `AuthContext`, `currentUser`, `requireRole`.
- `src/middlewares/school-scope.ts` (novo) — `requireSchoolScope`, `currentSchool`, `currentSchoolOrAll`.
- `src/modules/schools/schools.{routes,service}.ts` (novo).
- `src/modules/users/users.{routes,service}.ts` (novo).
- `src/modules/access-logs/*`, `src/modules/stats/stats.routes.ts` — suporte a "todas".
- `src/app.ts`, `src/docs/openapi.ts`, `prisma/seed.ts`.
- `tests/helpers.ts`, `tests/auth.test.ts`, `tests/school-scope.test.ts` (novo), `tests/schools.test.ts` (novo), `tests/users.test.ts` (novo), `tests/access-logs.test.ts`, `tests/docs.test.ts`.

**Web (`AccessControl/apps/web`)**
- `src/api/types.ts`, `src/api/index.ts`, `src/api/client.ts`.
- `src/contexts/AuthContext.tsx` — `user` no lugar de `school`.
- `src/contexts/SchoolScopeContext.tsx` (novo).
- `src/components/SchoolSelector.tsx` (novo), `src/components/RequireSchool.tsx` (novo), `src/components/AppLayout.tsx`.
- `src/pages/SchoolsPage.tsx`, `src/pages/UsersPage.tsx` (novos); `AccessLogsPage`, `DashboardPage`, `VerificationPage`, `RegisterPage`, `App.tsx`, `main.tsx`.
- `tests/SchoolScope.test.tsx`, `tests/RegisterPage.test.tsx`, `tests/AdminPages.test.tsx` (novos).

---

### Task 1: Modelo de usuários, migração e autenticação

**Files:**
- Modify: `apps/api/prisma/schema.prisma`, `apps/api/src/config/env.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/auth/auth.routes.ts`, `apps/api/src/middlewares/auth.ts`, `apps/api/prisma/seed.ts`, `apps/api/.env.example`
- Create: `apps/api/prisma/migrations/20261108000000_users_roles/migration.sql`
- Test: `apps/api/tests/helpers.ts`, `apps/api/tests/auth.test.ts`

**Interfaces:**
- Produces:
  - Prisma `UserRole` enum, `User` model exatamente como no spec ("Modelo de dados"); `School.users User[]`; `School.authUserId` removido.
  - `interface AuthContext { userId: number; role: UserRole; name: string; email: string; homeSchoolId: number | null }`
  - `currentUser(res: Response): AuthContext` (em `middlewares/auth.ts`)
  - `requireRole(...roles: UserRole[]): RequestHandler` → 403 `FORBIDDEN_ROLE` se fora.
  - `AuthService.authenticate(token): Promise<User & { school: School | null }>`
  - `AuthService.me(userId): Promise<MeDto>`; `type MeDto = { id: number; name: string; email: string; role: UserRole; school: { id: number; name: string } | null }`
  - helpers de teste: `school` (fixture existente sem `authUserId`), `schoolUser: User` (id 1, role SCHOOL, schoolId 1), `superAdmin: User` (id 2, role SUPER_ADMIN, schoolId 1, email do bootstrap), `buildTestApp({ user?: User })` que faz `prisma.user.findUnique` resolver `{ ...user, school }`.

- [ ] **Step 1: Atualizar schema.prisma** com enum/model do spec; remover `authUserId` de `School`; rodar `npx prisma validate` (em `apps/api`). Esperado: "The schema at prisma/schema.prisma is valid".

- [ ] **Step 2: Escrever a migration SQL à mão** em `20261108000000_users_roles/migration.sql`, nesta ordem:
  ```sql
  CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN','SCHOOL','STUDENT','EMPLOYEE','TEACHER');
  CREATE TABLE "users" ( ... colunas do model ..., CONSTRAINT "users_pkey" PRIMARY KEY ("id") );
  CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");
  CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
  CREATE INDEX "users_school_id_idx" ON "users"("school_id");
  ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  INSERT INTO "users" ("auth_user_id","email","name","role","school_id","updated_at")
    SELECT "auth_user_id", lower("email"), "name", 'SCHOOL', "id", now() FROM "schools" WHERE "auth_user_id" IS NOT NULL;
  UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "email" = 'rafaelhenriqueoliveira1234@gmail.com';
  CREATE UNIQUE INDEX "users_school_role_key" ON "users"("school_id") WHERE "role" = 'SCHOOL';
  DROP INDEX "schools_auth_user_id_key";
  ALTER TABLE "schools" DROP COLUMN "auth_user_id";
  ```
  Conferir que a DDL bate com o Prisma: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url "$SHADOW_URL"` se houver Postgres local (docker-compose do repo); esperado "No difference detected" exceto o índice parcial (Prisma não o modela; aceitável). Sem Postgres local, revisar manualmente contra `prisma migrate diff --from-empty --to-schema-datamodel` e seguir.

- [ ] **Step 3: Reescrever os testes de auth** (`tests/auth.test.ts`) para o novo modelo. Casos (nomes exatos):
  - `retorna o usuário com perfil e escola` → `GET /api/auth/me` = `{ id: 1, name, email, role: 'SCHOOL', school: { id: 1, name: school.name } }`; `prisma.user.findUnique` chamado com `{ where: { authUserId: AUTH_USER_ID }, include: { school: true } }`.
  - `primeiro acesso cria escola e usuário SCHOOL` → sem `users` e sem escola com o e-mail: `prisma.school.create` com `{ data: { name: 'Escola Nova', email: 'nova@escola.com', users: { create: { authUserId, email, name, role: 'SCHOOL' } } }, include: { users: true } }` (ou equivalente em `$transaction`); resposta `role: 'SCHOOL'`.
  - `primeiro acesso vincula escola criada pelo super admin` → escola existe com e-mail, sem usuário SCHOOL: `prisma.user.create` com `schoolId` dela; `school.create` não chamado.
  - `não vincula escola que já tem login de escola` → escola existe e já tem SCHOOL → 409 `EMAIL_IN_USE`.
  - `e-mail de bootstrap nasce SUPER_ADMIN` → `identity.user.email = 'RafaelHenriqueOliveira1234@gmail.com'` → usuário criado com `role: 'SUPER_ADMIN'` (e escola própria criada, como escola de teste).
  - manter: exige token, token inválido, sessão revogada, e-mail não confirmado, corrida P2002.

- [ ] **Step 4: Rodar** `npx jest tests/auth.test.ts` → FAIL (tipos/implementação antigos).

- [ ] **Step 5: Implementar** `env.SUPER_ADMIN_BOOTSTRAP_EMAIL` (z.string().email().default(...).transform(toLowerCase)), `AuthService` (`authenticate`, `me`, `provision` conforme spec "Provisionamento"; corrida P2002 → reler por `authUserId`), `createRequireAuth` gravando `AuthContext`, `currentUser`, `requireRole`. `/me` usa `currentUser(res).userId`. Atualizar `helpers.ts` e o seed (cria a escola + o usuário Supabase; o vínculo `users` nasce no primeiro login). Adicionar a variável em `.env.example`. Até a Task 2, `currentSchool` existente passa a ler `homeSchoolId` (mantém os outros testes verdes).

- [ ] **Step 6: Rodar** `npm test` e `npm run typecheck` em `apps/api` → tudo PASS.

- [ ] **Step 7: Commit** `feat(api): usuários com perfil e provisionamento por usuário`

---

### Task 2: Escola em uso (`X-School-Id`)

**Files:**
- Create: `apps/api/src/middlewares/school-scope.ts`, `apps/api/tests/school-scope.test.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/middlewares/auth.ts` (remover `currentSchool` daqui), todos os `*.routes.ts` que importam `currentSchool`

**Interfaces:**
- Consumes: `currentUser`, `AuthContext` (Task 1).
- Produces:
  - `requireSchoolScope(prisma: PrismaClient, opts?: { allowAll?: boolean }): RequestHandler`
  - `currentSchool(res): { sub: number }` — lança 400 `SCHOOL_REQUIRED` se o escopo for "todas".
  - `currentSchoolOrAll(res): { sub: number | null }`
  - Montagem em `app.ts`: `requireAuth` → `requirePanelAccess` (403 `NO_PANEL_ACCESS` para perfis que não são SUPER_ADMIN/SCHOOL) → `requireSchoolScope(prisma, { allowAll })`. Como `allowAll` depende da rota, aplicar `requireSchoolScope(prisma, { allowAll: true })` no nível do módulo para access-logs e stats e deixar `currentSchool` recusar "todas" nas rotas de escrita.

- [ ] **Step 1: Testes** em `school-scope.test.ts` usando `GET /api/courses` e `GET /api/access-logs` como alvo:
  - `SCHOOL sem cabeçalho usa a própria escola` → `course.findMany` com `schoolId: 1`.
  - `SCHOOL com X-School-Id da própria escola é aceito` → 200.
  - `SCHOOL com X-School-Id de outra escola recebe 403` → `code: 'SCHOOL_FORBIDDEN'`.
  - `SCHOOL com X-School-Id all recebe 403` → `SCHOOL_FORBIDDEN`.
  - `SUPER_ADMIN com X-School-Id 7 opera na escola 7` → `prisma.school.findUnique({ where: { id: 7 }, select: { id: true } })` resolve; `course.findMany` com `schoolId: 7`.
  - `SUPER_ADMIN com escola inexistente recebe 404` → `SCHOOL_NOT_FOUND`.
  - `SUPER_ADMIN sem cabeçalho usa a escola padrão`; `SUPER_ADMIN sem cabeçalho e sem escola padrão recebe 400` → `SCHOOL_REQUIRED`.
  - `all é recusado em rotas de escrita` → `POST /api/access-logs/manual` com `all` → 400 `SCHOOL_REQUIRED`; `GET /api/courses` com `all` → 400 `SCHOOL_REQUIRED`.
  - `X-School-Id inválido recebe 400` → para cada `['abc','0','-1','1.5']`, `code: 'INVALID_SCHOOL_ID'` (Review Focus 2).
  - `perfil sem acesso ao painel recebe 403` → user `role: 'STUDENT'` em `GET /api/courses` → `NO_PANEL_ACCESS`; `GET /api/auth/me` → 200.
  - `perfil é relido a cada requisição` → mesma app, 1ª chamada com `superAdmin` e `X-School-Id: 7` = 200; trocar mock para `role: 'SCHOOL'` e repetir = 403 (Review Focus 4).
- [ ] **Step 2: Rodar** `npx jest tests/school-scope.test.ts` → FAIL.
- [ ] **Step 3: Implementar** o middleware (parse com `z.union([z.literal('all'), z.coerce.number().int().positive()])` sobre o header bruto, rejeitando `1.5`), `requirePanelAccess`, trocar imports nos routes, montar em `app.ts`.
- [ ] **Step 4: Rodar** `npm test` e `npm run typecheck` → PASS.
- [ ] **Step 5: Commit** `feat(api): escola em uso pelo cabeçalho X-School-Id`

---

### Task 3: "Todas as escolas" em Entradas e Stats

**Files:**
- Modify: `apps/api/src/modules/access-logs/access-logs.{routes,service}.ts`, `apps/api/src/modules/stats/stats.routes.ts`
- Test: `apps/api/tests/access-logs.test.ts`, `apps/api/tests/school-scope.test.ts`

**Interfaces:**
- Consumes: `currentSchoolOrAll` (Task 2).
- Produces: `AccessLogsService.list(schoolId: number | null, q)` e `exportCsv(schoolId: number | null, q)`; itens passam a ter `school: { id: number; name: string }` (`include: { school: { select: { id: true, name: true } } }`) sempre, não só em "todas". CSV: cabeçalho `Escola;Nome;Data/Hora (UTC);Método` só no modo "todas"; no modo escola fica igual ao atual. Stats: `schoolId` omitido do `where` quando `null`; `recentEntries` incluem `school`.

- [ ] **Step 1: Testes**: `super admin lista entradas de todas as escolas` (`where` sem `schoolId`, item com `school.name`); `exportação de todas as escolas inclui coluna Escola` (primeira linha = `Escola;Nome;Data/Hora (UTC);Método`); `stats de todas as escolas não filtram por escola`; teste atual de lista continua passando com `schoolId: 1`.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar.** **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat(api): entradas e resumo de todas as escolas para o super admin`

---

### Task 4: Módulo Escolas

**Files:**
- Create: `apps/api/src/modules/schools/schools.{routes,service}.ts`, `apps/api/tests/schools.test.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/docs/openapi.ts`, `apps/api/tests/docs.test.ts`

**Interfaces:**
- Consumes: `requireRole('SUPER_ADMIN')`, `PhotoStorage`.
- Produces (montado em `/api/schools` com `apiRateLimit, requireAuth, requireRole('SUPER_ADMIN')`, **sem** `requireSchoolScope`):
  - `GET /` → `Array<{ id; name; email; createdAt; counts: { students; courses; accessLogs }; hasLogin: boolean }>` ordenado por nome.
  - `POST /` `{ name: string(1..100), email: email(≤120, lower) }` → 201 escola.
  - `PUT /:id` mesmo corpo → 200.
  - `DELETE /:id` → 204.
  - `SchoolsService(prisma, storage)` com `list()`, `create(input)`, `update(id, input)`, `remove(id)`.

- [ ] **Step 1: Testes**: `apenas super admin acessa escolas` (SCHOOL → 403 `FORBIDDEN_ROLE`); `lista escolas com contadores`; `cria escola`; `recusa e-mail de outra escola` (P2002 no create → 409 `EMAIL_IN_USE`); `recusa e-mail que já pertence a um usuário` (`user.findUnique({ where: { email } })` retorna alguém → 409 `EMAIL_IN_USE`; no PUT, ignorar se o usuário é o SCHOOL da própria escola); `editar e-mail não altera o usuário` (`user.update` não chamado); `excluir remove fotos do storage e a escola` (`storage.remove` chamado para cada aluno com `photoKey`; `user.deleteMany({ where: { schoolId, role: 'SCHOOL' } })` e `school.delete` chamados); `excluir segue mesmo se o storage falhar` (`storage.remove` rejeita → 204, `school.delete` chamado) (Review Focus 5); `excluir escola inexistente → 404 SCHOOL_NOT_FOUND`.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar**; super admins da escola ficam com `schoolId = null` pelo `onDelete: SetNull`. Falhas de storage: `logger.warn({ err, studentId }, ...)`. Adicionar paths `/api/schools`, `/api/schools/{id}` no OpenAPI e no `docs.test.ts`; documentar o header `X-School-Id` como parâmetro comum nas rotas com escopo.
- [ ] **Step 4:** `npm test` → PASS. **Step 5: Commit** `feat(api): gestão de escolas para o super admin`

---

### Task 5: Módulo Usuários

**Files:**
- Create: `apps/api/src/modules/users/users.{routes,service}.ts`, `apps/api/tests/users.test.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/docs/openapi.ts`, `apps/api/tests/docs.test.ts`

**Interfaces:**
- Produces (montado em `/api/users`, só SUPER_ADMIN):
  - `GET /?search=&role=` → `Array<{ id; name; email; role; school: { id; name } | null; createdAt }>`; `search` em nome/e-mail (insensitive), máx. 200 resultados ordenados por nome.
  - `PATCH /:id` `{ role: 'SCHOOL' | 'SUPER_ADMIN' }` → usuário atualizado.
  - `UsersService(prisma)` com `list(query)`, `changeRole(actorId, targetId, role)`.

- [ ] **Step 1: Testes**: `apenas super admin acessa usuários`; `lista com filtro de busca`; `promove usuário SCHOOL a SUPER_ADMIN`; `não permite rebaixar a si mesmo` → 409 `CANNOT_DEMOTE_SELF`; `não permite rebaixar o último super admin` (`user.count({ where: { role: 'SUPER_ADMIN' } })` = 1 → 409 `LAST_SUPER_ADMIN`; o teste usa outro alvo para separar do caso "si mesmo"); `rebaixar sem escola → 400 SCHOOL_REQUIRED`; `rebaixar para escola que já tem login → 409 SCHOOL_HAS_LOGIN` (P2002 do índice parcial ou checagem prévia); `perfis futuros não são aceitos` (`role: 'STUDENT'` → 400 de validação).
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (contagem + update dentro de `$transaction` interativa para evitar corrida de dois rebaixamentos). OpenAPI + docs.test com `/api/users`, `/api/users/{id}`.
- [ ] **Step 4:** `npm test`, `npm run typecheck`, `npm run lint` em `apps/api` → PASS. **Step 5: Commit** `feat(api): gestão de usuários e promoção a super admin`

---

### Task 6: Web — usuário autenticado e tipos

**Files:**
- Modify: `apps/web/src/api/types.ts`, `apps/web/src/api/index.ts`, `apps/web/src/api/auth.ts`, `apps/web/src/contexts/AuthContext.tsx`, `apps/web/src/App.tsx`, `apps/web/src/components/AppLayout.tsx`, quaisquer usos de `useAuth().school`
- Test: `apps/web/tests/LoginPage.test.tsx` (ajustar mocks de `/me`)

**Interfaces:**
- Produces:
  - `type UserRole = 'SUPER_ADMIN' | 'SCHOOL' | 'STUDENT' | 'EMPLOYEE' | 'TEACHER'`
  - `interface AuthUser { id: number; name: string; email: string; role: UserRole; school: { id: number; name: string } | null }`
  - `interface SchoolSummary { id; name; email; createdAt; counts: { students; courses; accessLogs }; hasLogin: boolean }`, `interface UserSummary { id; name; email; role; school: {id; name} | null; createdAt }`
  - `AccessLog.school?: { id: number; name: string }`
  - `useAuth(): { user: AuthUser | null; isSuperAdmin: boolean; loading; login; loadUser; logout }` (`loadSchool` renomeado `loadUser`).
  - `schoolsApi = { list, create(input: { name; email }), update(id, input), remove(id) }`, `usersApi = { list(params: { search?; role? }), changeRole(id, role) }`.
  - `ProtectedRoute`: perfis futuros veem uma tela "Seu acesso à plataforma estará disponível em breve" com botão Sair.

- [ ] **Step 1:** Ajustar `LoginPage.test.tsx` para o novo `/me` e adicionar `perfil de usuário futuro vê aviso de em breve` (mock `/me` com `role: 'STUDENT'` → texto `/disponível em breve/i`). Rodar `npx jest` em `apps/web` → FAIL.
- [ ] **Step 2: Implementar**; o nome exibido no `AppLayout` usa `user.school?.name ?? user.name`.
- [ ] **Step 3:** `npm test` + `npm run typecheck` em `apps/web` → PASS. **Step 4: Commit** `feat(web): sessão por usuário com perfil`

---

### Task 7: Web — seletor de escola e cabeçalho

**Files:**
- Create: `apps/web/src/contexts/SchoolScopeContext.tsx`, `apps/web/src/components/SchoolSelector.tsx`, `apps/web/src/components/RequireSchool.tsx`, `apps/web/tests/SchoolScope.test.tsx`
- Modify: `apps/web/src/api/client.ts`, `apps/web/src/main.tsx` (provider), `apps/web/src/components/AppLayout.tsx`, `apps/web/src/App.tsx`

**Interfaces:**
- Consumes: `useAuth`, `schoolsApi.list` (Task 6).
- Produces:
  - `client.ts`: `setSchoolScope(value: number | 'all' | null)`; `request` envia `X-School-Id` quando não-nulo.
  - `useSchoolScope(): { selected: number | 'all' | null; schools: SchoolSummary[]; select(v: number | 'all'): void; selectedName: string; reloadSchools(): Promise<void> }`. Para `SCHOOL`, `selected = user.school.id` e `schools = []` (sem chamada a `/schools`).
  - Persistência: chave `localStorage` `helpus.schoolScope` (try/catch). Inicial: valor salvo se ainda existir na lista; senão `user.school?.id`; senão a primeira escola; senão `null` (Review Focus 3).
  - `RequireSchool`: envolve Alunos, Cursos, Verificação, Configurações; se `selected === 'all'` ou `null`, mostra "Selecione uma escola no topo para usar esta tela".
  - Telas usam `key={String(selected)}` no `<Outlet />` do `AppLayout` para remontar e descartar respostas antigas (Review Focus 1).
  - Erro 403 `SCHOOL_FORBIDDEN` com `X-School-Id` → `loadUser()` e volta para a escola padrão (Review Focus 4).
  - Leitor: ao trocar a escola com `useSerial().connected`, toast "O leitor agora registra para {nome}".

- [ ] **Step 1: Testes** (`SchoolScope.test.tsx`, com fetch mockado como em `LoginPage.test.tsx`): `super admin vê o seletor com as escolas e "Todas as escolas"`; `trocar escola envia X-School-Id nas requisições`; `escola salva que não existe mais volta para a escola padrão`; `escola não vê o seletor e não chama /schools`; `Alunos em "Todas as escolas" pede para escolher uma escola`; `resposta atrasada da escola anterior não aparece após trocar` (fetch da escola A resolve depois da B; a tela mostra só dados de B).
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (seletor = `<select>` estilizado no topo do conteúdo do `AppLayout`, visível só com `isSuperAdmin`; opção "Todas as escolas" primeiro).
- [ ] **Step 4:** `npm test` → PASS. **Step 5: Commit** `feat(web): seletor de escola para o super admin`

---

### Task 8: Web — Entradas/Dashboard em "todas" e aviso do leitor

**Files:**
- Modify: `apps/web/src/pages/AccessLogsPage.tsx`, `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/pages/VerificationPage.tsx`, telas de cadastro de digital (onde `useFingerprintEnrollment` é usado)
- Test: `apps/web/tests/SchoolScope.test.tsx`

- [ ] **Step 1: Testes**: `entradas em todas as escolas mostram a coluna Escola`; `verificação mostra para qual escola o leitor registra` (texto `Registrando para {nome}` quando super admin).
- [ ] **Step 2:** FAIL. **Step 3: Implementar** (coluna "Escola" só quando `selected === 'all'`; no Dashboard, etiqueta com o nome da escola nas entradas recentes no modo "todas"; o banner da Verificação/digital só para super admin).
- [ ] **Step 4:** `npm test` → PASS. **Step 5: Commit** `feat(web): entradas de todas as escolas e aviso do leitor`

---

### Task 9: Web — telas Escolas e Usuários

**Files:**
- Create: `apps/web/src/pages/SchoolsPage.tsx`, `apps/web/src/pages/UsersPage.tsx`, `apps/web/tests/AdminPages.test.tsx`
- Modify: `apps/web/src/App.tsx` (rotas `/escolas`, `/usuarios` dentro de um guard `SuperAdminRoute` que redireciona para `/`), `apps/web/src/components/AppLayout.tsx` (itens de menu só para super admin), `apps/web/src/components/Icons.tsx` se precisar de ícones

- [ ] **Step 1: Testes**: `escola não acessa /escolas` (redireciona para início); `lista e cria escola` (Drawer com Nome/E-mail → POST `/schools`, toast, lista recarrega, `reloadSchools` do seletor chamado); `excluir escola exige digitar o nome` (botão de confirmar desabilitado até digitar exatamente o nome); `promover login de escola mostra aviso` (texto contém "ficará sem login próprio" e "poder total"); `erro LAST_SUPER_ADMIN aparece como toast`.
- [ ] **Step 2:** FAIL. **Step 3: Implementar** com `PageHeader`, `Drawer`, `ConfirmDialog` e toasts existentes. Usuários: busca, filtro de perfil, coluna escola, botão "Tornar super admin" / "Tornar escola"; o próprio usuário sem botão de rebaixar.
- [ ] **Step 4:** `npm test` + `npm run typecheck` → PASS. **Step 5: Commit** `feat(web): telas de escolas e usuários`

---

### Task 10: Web — cadastro "Sou uma escola / Sou um usuário"

**Files:**
- Modify: `apps/web/src/pages/RegisterPage.tsx`, `apps/web/src/api/auth.ts` (enviar `account_type: 'school'` em `options.data`)
- Create: `apps/web/tests/RegisterPage.test.tsx`

- [ ] **Step 1: Testes**: `cadastro começa pela escolha do tipo de conta` (dois cartões: "Sou uma escola" e "Sou um usuário" com "Em breve"); `"Sou um usuário" está desabilitado`; `"Sou uma escola" abre o formulário atual` e o `signUp` recebe `options.data` com `account_type: 'school'`.
- [ ] **Step 2:** FAIL. **Step 3: Implementar.** **Step 4:** `npm test` → PASS. **Step 5: Commit** `feat(web): escolha do tipo de conta no cadastro`

---

### Task 11: Verificação final e aplicação no banco

- [ ] **Step 1:** Na raiz `AccessControl`: `npm run lint && npm run typecheck && npm test && npm run build` → tudo verde.
- [ ] **Step 2:** **Pedir confirmação ao usuário** antes de tocar no Supabase. Com o ok: conferir via SQL se `rafaelhenriqueoliveira1234@gmail.com` tem `auth_user_id` em `schools`; aplicar a migration (`npx prisma migrate deploy` com `DIRECT_URL`, ou o deploy do Render já roda `prisma:deploy` — conferir `render.yaml`); validar `SELECT email, role, school_id FROM users WHERE role = 'SUPER_ADMIN'`.
- [ ] **Step 3:** Atualizar `README.md`/`DEPLOY.md` com `SUPER_ADMIN_BOOTSTRAP_EMAIL` e os perfis. Commit `docs: perfis de acesso e variável de bootstrap`.
