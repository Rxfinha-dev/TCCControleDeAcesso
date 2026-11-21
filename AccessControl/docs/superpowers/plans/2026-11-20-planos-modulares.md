# Planos modulares por escola — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada escola tem um plano (escada BASIC → ACADEMIC → ATTENDANCE → ASSESSMENTS) que libera módulos; a API recusa e o front esconde o que o plano não inclui; o super admin troca o plano numa tela.

**Architecture:** Enum `SchoolPlan` na escola; `lib/plans.ts` é a única tradução plano → módulos. `requireSchoolScope` grava o plano da escola em uso em `res.locals.schoolPlan` sem consulta extra; `requireModule(m)` recusa com 403 `MODULE_NOT_IN_PLAN`. O front recebe `modules` em `/auth/me` e `/schools` e expõe `hasModule` pelo `SchoolScopeContext`.

**Tech Stack:** Express 5, Prisma, Zod, Jest + supertest + jest-mock-extended (api); React + React Router + Jest/Testing Library (web).

**Spec:** `AccessControl/docs/superpowers/specs/2026-11-20-planos-modulares-design.md`

## Global Constraints

- Mensagem do 403: `Este recurso não está incluído no plano da escola.` · código `MODULE_NOT_IN_PLAN`.
- Módulos: `ACCESS`, `ACADEMIC`, `ATTENDANCE`, `ASSESSMENTS`. Planos: `BASIC`, `ACADEMIC`, `ATTENDANCE`, `ASSESSMENTS`.
- Rotas e telas perguntam por **módulo** (`hasModule`), nunca comparam nível de plano.
- Escolas existentes ficam `ASSESSMENTS`; escola nova nasce `BASIC`.
- Rebaixar não apaga dado algum.
- O plano nunca vem do cliente (exceto `PUT /api/schools/:id/plan` e `POST /api/schools`, só super admin).
- Comandos: api `cd AccessControl/apps/api && npx jest <arquivo>`; web `cd AccessControl/apps/web && npx jest <arquivo>`. Commits sem `Co-Authored-By`.

## Review Focus

1. Super admin troca a escola no seletor para uma de plano menor: menu e rotas mudam na hora (sem recarregar). Teste no Task 5.
2. Escola tem o plano rebaixado com a tela aberta: a próxima chamada recebe `MODULE_NOT_IN_PLAN` e a tela mostra o aviso do plano, não um erro genérico. Teste no Task 5.
3. Professor de escola `ACADEMIC` (sem `ATTENDANCE`) loga: não quebra, vê o aviso na home. Teste de API no Task 2, de tela no Task 5.
4. Modo "todas as escolas" continua funcionando em entradas e início (só `ACCESS`). Teste no Task 2.
5. `PUT /api/schools/:id` com `plan` no corpo não altera o plano (campo ignorado pelo schema). Teste no Task 4.

---

### Task 1: Plano no banco e tradução plano → módulos

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (enum `SchoolPlan` + `School.plan SchoolPlan @default(BASIC)`)
- Create: `apps/api/prisma/migrations/20261120000000_school_plans/migration.sql`
- Create: `apps/api/src/lib/plans.ts`
- Modify: `apps/api/tests/helpers.ts` (`school.plan = 'ASSESSMENTS'`)
- Test: `apps/api/tests/plans.test.ts`, `apps/api/tests/migrations.test.ts`

**Interfaces:**
- Produces: `MODULES`, `type Module`, `modulesOf(plan: SchoolPlan | null): Module[]`, `hasModule(plan: SchoolPlan | null, module: Module): boolean`, `PLAN_MODULES: Record<SchoolPlan, readonly Module[]>`.

- [ ] **Step 1: Testes que falham** (`tests/plans.test.ts`, `describe('modulesOf')`)
  - `modulesOf('BASIC')` → `['ACCESS']`; `'ACADEMIC'` → `['ACCESS','ACADEMIC']`; `'ATTENDANCE'` → `['ACCESS','ACADEMIC','ATTENDANCE']`; `'ASSESSMENTS'` → os quatro.
  - `hasModule('ATTENDANCE','ASSESSMENTS')` → `false`; `hasModule('ASSESSMENTS','ACCESS')` → `true`.
  - Falha fechada: `modulesOf(null)` → `[]`; `modulesOf('X' as never)` → `[]`.
  - Em `migrations.test.ts`: o SQL de `20261120000000_school_plans` contém `ADD COLUMN "plan" "SchoolPlan" NOT NULL DEFAULT 'ASSESSMENTS'` e depois `ALTER COLUMN "plan" SET DEFAULT 'BASIC'`.
- [ ] **Step 2:** `npx jest tests/plans.test.ts tests/migrations.test.ts` → FAIL (módulo/arquivo inexistente).
- [ ] **Step 3: Implementar.** Migration:
  ```sql
  CREATE TYPE "SchoolPlan" AS ENUM ('BASIC', 'ACADEMIC', 'ATTENDANCE', 'ASSESSMENTS');
  -- Escolas existentes ficam com tudo liberado; escolas novas nascem no Básico.
  ALTER TABLE "schools" ADD COLUMN "plan" "SchoolPlan" NOT NULL DEFAULT 'ASSESSMENTS';
  ALTER TABLE "schools" ALTER COLUMN "plan" SET DEFAULT 'BASIC';
  ```
  `plans.ts`: `PLAN_MODULES` explícito (não derivar da ordem do enum); `modulesOf` usa `PLAN_MODULES[plan] ?? []`. Rodar `npx prisma generate`. Atualizar `helpers.ts`.
- [ ] **Step 4:** os dois testes PASS; `npx tsc --noEmit` sem erro.
- [ ] **Step 5:** commit `feat(planos): plano da escola no banco e tradução para módulos`.

### Task 2: Guard de módulo nas rotas

**Files:**
- Modify: `apps/api/src/middlewares/auth.ts` (`AuthContext.homeSchoolPlan: SchoolPlan | null`, de `user.school?.plan ?? null`)
- Modify: `apps/api/src/middlewares/school-scope.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/modules/class-groups/class-groups.routes.ts`, `apps/api/src/modules/logins/logins.routes.ts`
- Test: `apps/api/tests/plans.test.ts` (`describe('requireModule')`)

**Interfaces:**
- Consumes: `hasModule`, `Module` (Task 1).
- Produces: `requireModule(module: Module): RequestHandler`; `currentPlan(res: Response): SchoolPlan | null` (plano da escola em uso; `null` em "todas"). `requireSchoolScope` grava `res.locals.schoolPlan`: não-super admin e super admin sem cabeçalho → `homeSchoolPlan`; super admin com id → `select: { id: true, plan: true }`; `'all'` → `null`.

- [ ] **Step 1: Testes que falham.** Helper local `appWithPlan(plan, user?)` que sobrescreve `prisma.user.findUnique` com `school: { ...school, plan }`. Casos (`it.each` onde couber):
  - BASIC: `GET /api/subjects`, `/api/teachers`, `/api/calendar?year=2026`, `/api/attendance/alerts`, `/api/assessments?classGroupId=20`, `/api/report-cards/10`, `GET /api/class-groups/20/timetable`, `PUT /api/class-groups/20/assignments/1` → 403 `MODULE_NOT_IN_PLAN`, e o prisma do recurso não é chamado.
  - BASIC: `GET /api/class-groups/20/students` e `GET /api/courses` → 200.
  - ACADEMIC: `GET /api/subjects` → 200; `GET /api/attendance/alerts` → 403.
  - ATTENDANCE: `PUT /api/logins/teachers/5` passa do guard (≠ 403 MODULE); `PUT /api/logins/students/10` e `POST /api/logins/class-groups/20` → 403.
  - Professor (`role: 'TEACHER', teacherId: 5`) de escola ACADEMIC: `GET /api/attendance/my-lessons` → 403 `MODULE_NOT_IN_PLAN`.
  - Aluno (`role: 'STUDENT', studentId: 10`) de escola ATTENDANCE: `GET /api/student/panel` → 403.
  - Super admin com `X-School-Id: 7` e `prisma.school.findUnique` → `{ id: 7, plan: 'BASIC' }`: `GET /api/subjects` → 403; com `'ASSESSMENTS'` → 200.
  - Super admin `X-School-Id: all` em escola padrão BASIC: `GET /api/access-logs` e `/api/stats` → 200.
- [ ] **Step 2:** `npx jest tests/plans.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** `requireModule`: `ACCESS` sempre passa; senão `hasModule(res.locals.schoolPlan ?? null, m)` ou `forbidden(MENSAGEM, 'MODULE_NOT_IN_PLAN')`. Montagens em `app.ts` (depois do scope): `ACADEMIC` em subjects, teachers, calendar; `ATTENDANCE` em attendance; `ASSESSMENTS` em assessments, report-cards; `/api/student` ganha `requireSchoolScope(prisma), requireModule('ASSESSMENTS')`. Por rota: em class-groups, `requireModule('ACADEMIC')` nas de `assignments` e `timetable`; em logins, `ATTENDANCE` em `/teachers/:id`, `ASSESSMENTS` em `/students/:id` e `/class-groups/:id`.
- [ ] **Step 4:** `npx jest` (suíte inteira da api) PASS — os testes antigos usam escola `ASSESSMENTS`.
- [ ] **Step 5:** commit `feat(planos): API recusa rotas de módulos fora do plano`.

### Task 3: Respostas, configurações e cópia de ano respeitam o plano

**Files:**
- Modify: `apps/api/src/modules/settings/settings.routes.ts`
- Modify: `apps/api/src/modules/class-groups/class-groups.routes.ts`, `class-groups.service.ts` (`get`, `copyYear`), `enrollments.service.ts` (lista de alunos da turma)
- Modify: `apps/api/src/modules/teachers/teachers.routes.ts`, `teachers.service.ts` (`list`)
- Test: `apps/api/tests/plans.test.ts` (`describe('respostas por plano')`)

**Interfaces:**
- Consumes: `currentPlan(res)`, `hasModule` (Tasks 1–2).
- Produces: `ClassGroupsService.get(schoolId, id, opts: { academic: boolean })` (sem `academic`, a chave `assignments` não aparece); `ClassGroupsService.copyYear(schoolId, fromYear, toYear, opts: { academic: boolean })`; `EnrollmentsService.list(..., opts: { logins: boolean })` (sem `logins`, a chave `username` não aparece); `TeachersService.list(schoolId, opts: { logins: boolean })` (idem).

- [ ] **Step 1: Testes que falham.**
  - BASIC `GET /api/class-groups/20` → body sem a chave `assignments`; ASSESSMENTS → com.
  - BASIC `GET /api/class-groups/20/students` → itens sem `username`; ASSESSMENTS → com.
  - ACADEMIC `GET /api/teachers` → itens sem `username`; ATTENDANCE → com.
  - BASIC `POST /api/class-groups/copy` → `prisma.teachingAssignment.createMany` e `prisma.timetableVersion.create` não chamados; matrículas copiadas como hoje. ACADEMIC → chamados.
  - `GET /api/settings`: BASIC → `{}`; ATTENDANCE → `{ minAttendance, code }`; ASSESSMENTS → `{ minAttendance, code, grading }`.
  - `PUT /api/settings`: BASIC com `{ minAttendance: 80 }` → 403 `MODULE_NOT_IN_PLAN`; ATTENDANCE com `{ grading: {...} }` → 403; ATTENDANCE com `{ code: 'etec-jau' }` → 200.
- [ ] **Step 2:** `npx jest tests/plans.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** As rotas leem `currentPlan(res)` e passam `hasModule(...)` aos serviços; `minAttendance`/`code` exigem `ATTENDANCE`, `grading` exige `ASSESSMENTS`.
- [ ] **Step 4:** `npx jest` PASS (ajustar os testes existentes de turma/professor/configurações que mudarem de assinatura, sem mudar o que verificam).
- [ ] **Step 5:** commit `feat(planos): respostas, configurações e cópia de ano seguem o plano`.

### Task 4: Plano nas escolas, troca pelo super admin e `/auth/me`

**Files:**
- Modify: `apps/api/src/modules/schools/schools.service.ts`, `schools.routes.ts`
- Modify: `apps/api/src/modules/auth/auth.service.ts` (`MeDto.school: { id, name, plan, modules } | null`)
- Modify: `apps/api/src/docs/` (spec OpenAPI: `SchoolPlan`, `modules`, `PUT /schools/{id}/plan`, erro `MODULE_NOT_IN_PLAN`)
- Test: `apps/api/tests/schools.test.ts`, `apps/api/tests/auth.test.ts`, `apps/api/tests/docs.test.ts`

**Interfaces:**
- Consumes: `modulesOf` (Task 1).
- Produces: `SchoolsService.setPlan(id: number, plan: SchoolPlan, actorUserId: number)`; DTO de escola (list/create/update/setPlan) ganha `plan: SchoolPlan` e `modules: Module[]`; `schoolSchema` ganha `plan: z.enum(SchoolPlan).optional()` só no create (o update usa o schema sem `plan`).

- [ ] **Step 1: Testes que falham.**
  - `PUT /api/schools/1/plan { plan: 'ATTENDANCE' }` como super admin → 200, `prisma.school.update` com `data: { plan: 'ATTENDANCE' }`, body com `modules` dos três.
  - Mesmo endpoint como `SCHOOL` → 403; `{ plan: 'GOLD' }` → 400; escola inexistente → 404.
  - `PUT /api/schools/1 { name, email, plan: 'BASIC' }` → `update` chamado sem `plan` em `data`.
  - `POST /api/schools` sem `plan` → `create` sem `plan` em `data` (default do banco = BASIC); com `plan: 'ACADEMIC'` → `data.plan === 'ACADEMIC'`.
  - `GET /api/schools` → cada item com `plan` e `modules`.
  - `GET /api/auth/me` → `school.plan` e `school.modules`.
  - `docs.test.ts` continua passando (refs válidas) e o caminho `/api/schools/{id}/plan` existe.
- [ ] **Step 2:** rodar os três arquivos → FAIL.
- [ ] **Step 3: Implementar.** `setPlan` faz `logger.info({ schoolId, from, to, by: actorUserId }, 'plano da escola alterado')`.
- [ ] **Step 4:** `npx jest` PASS; `npx tsc --noEmit`; `npm run lint`.
- [ ] **Step 5:** commit `feat(planos): super admin troca o plano da escola`.

### Task 5: Front respeita o plano

**Files:**
- Modify: `apps/web/src/api/types.ts` (`Module`, `SchoolPlan`; `AuthUser.school: (SchoolRef & { plan; modules }) | null`; `SchoolSummary` + `plan`, `modules`; DTOs de turma/aluno/professor com `assignments?`/`username?` opcionais)
- Modify: `apps/web/src/contexts/SchoolScopeContext.tsx` (expõe `hasModule(m: Module): boolean`)
- Create: `apps/web/src/components/RequireModule.tsx`
- Modify: `apps/web/src/App.tsx`, `components/AppLayout.tsx`, `pages/ClassGroupPage.tsx`, `pages/SettingsPage.tsx`, `pages/DashboardPage.tsx`, `pages/TeacherHomePage.tsx`, `pages/StudentHomePage.tsx`, `pages/StudentsPage.tsx`, `pages/ClassGroupsPage.tsx`
- Test: `apps/web/tests/Modules.test.tsx`

**Interfaces:**
- Consumes: `modules` em `/auth/me` e `/schools` (Task 4); código `MODULE_NOT_IN_PLAN` (Task 2).
- Produces: `hasModule` no contexto — super admin: `modules` da escola selecionada em `schools` (em `'all'` ou `null`: só `ACCESS`); demais perfis: `user.school?.modules ?? []`. `<RequireModule module>` mostra `Este recurso não está incluído no plano da escola.` no mesmo estilo do `RequireSchool`. Constante `PLAN_NOTICE` com esse texto, exportada de `RequireModule.tsx`.

- [ ] **Step 1: Testes que falham** (`tests/Modules.test.tsx`, seguindo os mocks dos testes de tela existentes):
  - SCHOOL com plano BASIC: menu sem Disciplinas, Professores, Calendário, Presença, Avaliações; com Alunos, Turmas, Entradas.
  - Navegar para `/presenca` com BASIC → texto `PLAN_NOTICE`.
  - Turma com BASIC → só a aba Alunos.
  - Configurações com ATTENDANCE → seção Frequência visível, `GradingForm` ausente.
  - Super admin troca no seletor de escola ASSESSMENTS para escola BASIC → item Presença some sem recarregar.
  - Chamada que responde 403 `MODULE_NOT_IN_PLAN` numa tela aberta → aparece `PLAN_NOTICE` (não o toast genérico).
  - Professor de escola ACADEMIC → home mostra `PLAN_NOTICE`, menu só com Início.
  - Diálogo de excluir aluno contém `Presenças, notas e atestados deste aluno também serão apagados.`; o de excluir turma contém `A grade, as presenças e as avaliações desta turma também serão apagadas.`
- [ ] **Step 2:** `npx jest tests/Modules.test.tsx` → FAIL.
- [ ] **Step 3: Implementar.** Itens do menu ganham `module?: Module`; rotas do `App.tsx` envolvidas por `RequireModule` com o mesmo mapa da spec; `AttendanceAlerts` só com `ATTENDANCE`. O 403 `MODULE_NOT_IN_PLAN` é tratado onde as telas já mostram erro de carregamento (renderizar `PLAN_NOTICE` quando `error.code === 'MODULE_NOT_IN_PLAN'`).
- [ ] **Step 4:** `npx jest` (web inteiro) PASS; `npx tsc --noEmit`; `npm run lint`.
- [ ] **Step 5:** commit `feat(planos): telas e menu seguem o plano da escola`.

### Task 6: Tela de plano do super admin

**Files:**
- Modify: `apps/web/src/api/index.ts` (`schoolsApi.setPlan(id, plan)`; `create` aceita `plan?`)
- Modify: `apps/web/src/pages/SchoolsPage.tsx`
- Test: `apps/web/tests/AdminPages.test.tsx`

**Interfaces:**
- Consumes: `PUT /api/schools/:id/plan` (Task 4); `reloadSchools()` do `SchoolScopeContext`; `Drawer`, `ConfirmDialog`.
- Produces: rótulos `PLAN_LABELS: Record<SchoolPlan, string>` = Básico, Acadêmico, Frequência, Avaliações, com as descrições do mockup da spec.

- [ ] **Step 1: Testes que falham.**
  - Tabela de escolas mostra coluna "Plano" com o rótulo.
  - Ação "Plano" abre o drawer com quatro rádios, o atual marcado; subir de plano e salvar chama `setPlan(id, 'ASSESSMENTS')` sem confirmação.
  - Rebaixar de ASSESSMENTS para BASIC abre confirmação que lista Disciplinas, Presença, Avaliações (o que deixa de acessar) e contém `Nenhum dado é apagado`; confirmar chama `setPlan`; cancelar não chama.
  - Depois de salvar, `reloadSchools` é chamado.
  - Formulário de nova escola tem o campo plano, padrão Básico.
- [ ] **Step 2:** `npx jest tests/AdminPages.test.tsx` → FAIL.
- [ ] **Step 3: Implementar** (a lista "deixa de acessar" = `modules` atuais − `modules` do novo plano, mapeada para nomes de tela).
- [ ] **Step 4:** `npx jest` PASS; `npx tsc --noEmit`; `npm run lint`.
- [ ] **Step 5:** commit `feat(planos): tela para o super admin trocar o plano da escola`.

### Task 7: Verificação final

- [ ] api: `npx jest && npx tsc --noEmit && npm run lint` — tudo verde.
- [ ] web: `npx jest && npx tsc --noEmit && npm run lint && npm run build` — tudo verde.
- [ ] `npx prisma migrate deploy` contra o banco local (docker-compose) e conferir `SELECT plan FROM schools` = `ASSESSMENTS` nas existentes.
- [ ] Atualizar `AccessControl/README.md` (seção curta: planos e módulos, como trocar).
- [ ] Rodar a skill `security-review` na branch e corrigir o que for confirmado.
- [ ] commit `docs: planos modulares no README`.
