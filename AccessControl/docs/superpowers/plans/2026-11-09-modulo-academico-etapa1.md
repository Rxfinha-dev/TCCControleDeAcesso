# Módulo acadêmico — Etapa 1: turmas, disciplinas, professores e grade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A escola cadastra disciplinas, professores (só cadastro, sem login) e turmas, coloca alunos nas turmas, define quem leciona cada disciplina e monta a grade semanal de cada turma numa agenda livre de arrastar.

**Architecture:** Novos módulos Express em `apps/api/src/modules/{subjects,teachers,class-groups}` no padrão de `courses` (service com Prisma + Zod, rotas montadas em `scoped`). A grade é versionada por data de vigência (`TimetableVersion`), e as regras de sobreposição ficam num módulo puro testável. No web, páginas novas (Disciplinas, Professores, Turmas, detalhe da Turma) e um editor de grade cujo estado vive num reducer puro testado à parte do componente.

**Tech Stack:** Express 5, Prisma 6, Postgres (Supabase), Zod 4, Jest + supertest + jest-mock-extended; React 19, react-router 7, Jest + Testing Library. Arrastar com a API nativa de drag-and-drop e pointer events (sem biblioteca nova).

**Spec:** `AccessControl/docs/superpowers/specs/2026-11-08-modulo-academico-design.md` (seções 1, 2, 9 e 10, etapa 1)

## Global Constraints

- Fuso de todos os cálculos de dia: `America/Sao_Paulo`.
- Padrões existentes: módulos em `apps/api/src/modules/<nome>`, Zod para validação, escopo via `requireSchoolScope`/`currentSchool(res).sub`, erros por `badRequest/notFound/conflict` de `src/lib/errors.ts` com códigos em MAIÚSCULAS, mensagens em português.
- Toda mudança de schema com migration; RLS habilitado em toda tabela nova.
- OpenAPI (`src/docs/openapi.ts`) atualizado para toda rota nova.
- Não rodar prettier. Commits sem `Co-Authored-By: Claude`.
- Encaixe da grade: múltiplos de **5 minutos**. Blocos da mesma turma **não se sobrepõem** (bloqueia). Mesmo professor em duas turmas no mesmo horário: **avisa e deixa salvar**.
- Grade alterada vale **a partir do dia em que foi salva**.
- Edição da grade só em telas largas; no celular a grade é somente leitura.
- Trabalhar no branch `feat/modulo-academico-etapa1` criado a partir de `develop`.
- Comandos: `npm test -w apps/api`, `npm test -w apps/web`, `npm run lint`, `npm run typecheck` em `AccessControl/`.

## Review Focus

1. Aluno colocado numa turma e trocado de novo no mesmo dia → corrige a matrícula do dia (sem histórico de duração zero); troca em dia posterior fecha a antiga e abre a nova.
2. Grade salva duas vezes no mesmo dia → substitui a versão do dia; não cria segunda versão com a mesma data.
3. Bloco com fim ≤ início, minuto fora de múltiplo de 5, fora de 00:00–24:00 ou weekday fora de 1–6 → 400, nada gravado.
4. Retirar a atribuição de uma disciplina que está na grade vigente → 409 `ASSIGNMENT_IN_USE`.
5. IDs de outra escola (disciplina, professor, aluno, curso, turma) → recusados (400/404), nunca vinculados.

Cada item tem seu teste na task dona (marcado com **[RF n]**).

## Data model (decidido aqui; Task 1 implementa)

```prisma
enum Shift { MORNING AFTERNOON EVENING FULL_TIME }
enum TimetableSlotKind { LESSON BREAK }

model Teacher {            // @@map("teachers")
  id Int @id @default(autoincrement())
  schoolId Int            // FK schools, onDelete Cascade
  name String @db.VarChar(100)
  contactEmail String? @db.VarChar(120)
  createdAt/updatedAt
  @@index([schoolId, name])
}
model Subject {            // @@map("subjects")
  id, schoolId (Cascade), name VarChar(60), abbreviation VarChar(8), color VarChar(7)  // "#RRGGBB"
  @@unique([schoolId, name])
}
model ClassGroup {         // @@map("class_groups")
  id, schoolId (Cascade), name VarChar(40), schoolYear Int, shift Shift,
  courseId Int? (FK courses, onDelete SetNull)
  @@unique([schoolId, schoolYear, name])
}
model Enrollment {         // @@map("enrollments") — intervalo meio-aberto [startDate, endDate)
  id, classGroupId (Cascade), studentId (FK students, Cascade), schoolYear Int,
  startDate DateTime @db.Date, endDate DateTime? @db.Date
  @@index([studentId, schoolYear])
}
model TeachingAssignment { // @@map("teaching_assignments")
  id, classGroupId (Cascade), subjectId (Restrict), teacherId (Restrict)
  @@unique([classGroupId, subjectId])
}
model TimetableVersion {   // @@map("timetable_versions")
  id, classGroupId (Cascade), validFrom DateTime @db.Date, createdAt
  @@unique([classGroupId, validFrom])
}
model TimetableSlot {      // @@map("timetable_slots")
  id, versionId (Cascade), kind TimetableSlotKind, subjectId Int? (Restrict),
  weekday Int /* 1=seg … 6=sáb */, startMinute Int, endMinute Int /* minutos desde 00:00 */
}
```

- `Student.courseId` → `Int?` (relação opcional, `onDelete: Restrict` mantido) e `Student.year` → `SchoolYear?` — em migration própria na Task 2 (`20261109000100_student_optional_course`), porque o ts-jest checa tipos e a mudança quebra o código de alunos até a Task 2.
- Migration SQL manual (além do gerado): `CREATE UNIQUE INDEX "enrollments_open_key" ON "enrollments" ("student_id", "school_year") WHERE "end_date" IS NULL;` e `ALTER TABLE … ENABLE ROW LEVEL SECURITY;` para as 7 tabelas.
- O professor de um bloco LESSON é resolvido pela atribuição (turma + disciplina) vigente; o slot guarda só `subjectId`.
- Grade vigente numa data D = versão com maior `validFrom ≤ D`.

## API (decidido aqui)

Todas em `scoped` (escola em uso obrigatória). Corpo/resposta em JSON.

| Rota | Faz |
|---|---|
| `GET/POST /api/subjects`, `PUT/DELETE /api/subjects/:id` | CRUD de disciplinas |
| `GET/POST /api/teachers`, `PUT/DELETE /api/teachers/:id` | CRUD de professores |
| `GET /api/class-groups?schoolYear=2026` | lista turmas do ano (padrão: ano atual em SP), com `studentsCount` e `course` |
| `POST /api/class-groups`, `GET/PUT/DELETE /api/class-groups/:id` | CRUD; `GET :id` traz `assignments` |
| `POST /api/class-groups/copy` `{ fromYear, toYear }` | copia turmas, atribuições e grade vigente |
| `GET /api/class-groups/:id/students` | alunos com matrícula aberta |
| `POST /api/class-groups/:id/students` `{ studentIds: number[] }` | matricula / transfere |
| `DELETE /api/class-groups/:id/students/:studentId` | retira da turma |
| `PUT /api/class-groups/:id/assignments/:subjectId` `{ teacherId }` | define professor da disciplina |
| `DELETE /api/class-groups/:id/assignments/:subjectId` | retira a disciplina da turma |
| `GET /api/class-groups/:id/timetable` | grade vigente hoje |
| `PUT /api/class-groups/:id/timetable` `{ blocks }` | salva grade (versão de hoje) |

Bloco: `{ kind: 'LESSON'|'BREAK', subjectId?: number, weekday: 1–6, startMinute, endMinute }`.
Resposta da grade: `{ validFrom: 'YYYY-MM-DD' | null, blocks: [{ id, kind, weekday, startMinute, endMinute, subject: {id,name,abbreviation,color} | null, teacher: {id,name} | null }], warnings: TeacherConflict[] }`.
`TeacherConflict = { weekday, startMinute, endMinute, teacherName, classGroupName }`.

---

### Task 1: Schema, migration e utilitário de data

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20261109000000_academic_structure/migration.sql`
- Create: `apps/api/src/lib/dates.ts`
- Test: `apps/api/tests/migrations.test.ts`, `apps/api/tests/dates.test.ts`

**Interfaces:**
- Produces: modelos Prisma acima (`prisma.subject`, `prisma.teacher`, `prisma.classGroup`, `prisma.enrollment`, `prisma.teachingAssignment`, `prisma.timetableVersion`, `prisma.timetableSlot`); `todayInSaoPaulo(now?: Date): string` (`'YYYY-MM-DD'`); `dateOnly(iso: string): Date` (meia-noite UTC daquela data, para colunas `@db.Date`); `currentSchoolYear(now?: Date): number`.

- [ ] **Step 1: Testes que falham**

```ts
// migrations.test.ts (novo describe)
const academic = readFileSync(join(__dirname, '../prisma/migrations/20261109000000_academic_structure/migration.sql'), 'utf-8');
it.each(['teachers','subjects','class_groups','enrollments','teaching_assignments','timetable_versions','timetable_slots'])(
  'habilita RLS em %s', (t) => expect(academic).toMatch(new RegExp(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY;`)));
it('garante uma matrícula aberta por aluno e ano', () =>
  expect(academic).toMatch(/CREATE UNIQUE INDEX "enrollments_open_key" ON "enrollments" \("student_id", "school_year"\) WHERE "end_date" IS NULL;/));

// dates.test.ts
expect(todayInSaoPaulo(new Date('2026-03-10T02:30:00Z'))).toBe('2026-03-09'); // 23:30 em SP
expect(todayInSaoPaulo(new Date('2026-03-10T03:00:00Z'))).toBe('2026-03-10');
expect(currentSchoolYear(new Date('2027-01-01T02:00:00Z'))).toBe(2026);
expect(dateOnly('2026-03-09').toISOString()).toBe('2026-03-09T00:00:00.000Z');
```

- [ ] **Step 2:** `npm test -w apps/api -- migrations dates` → FAIL (arquivo da migration e módulo inexistentes).
- [ ] **Step 3:** Editar `schema.prisma` conforme o Data model; gerar a migration com `npx prisma migrate dev --create-only --name academic_structure` se houver banco local, senão escrever o SQL à mão no padrão de `20261108000000_users_roles`; renomear a pasta para `20261109000000_academic_structure`; acrescentar o índice parcial e os 7 `ENABLE ROW LEVEL SECURITY`. Implementar `dates.ts` com `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })`. Rodar `npx prisma generate`.
- [ ] **Step 4:** `npm test -w apps/api` e `npm run typecheck -w apps/api` → PASS.
- [ ] **Step 5: Commit** `feat(api): estrutura acadêmica no banco (turmas, disciplinas, professores, grade)`

### Task 2: Curso e série opcionais no aluno

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (`Student.courseId Int?`, `year SchoolYear?`, `course Course?`)
- Create: `apps/api/prisma/migrations/20261109000100_student_optional_course/migration.sql`
- Modify: `apps/api/src/modules/students/students.schemas.ts`, `students.service.ts`, `apps/api/src/modules/access-logs/access-logs.service.ts` (se o tipo exigir), `apps/api/src/docs/openapi.ts`
- Modify: `apps/web/src/api/types.ts`, `apps/web/src/api/index.ts`, `apps/web/src/pages/StudentsPage.tsx`, `apps/web/src/pages/VerificationPage.tsx`
- Test: `apps/api/tests/students.test.ts`, teste web existente de alunos ou novo `apps/web/tests/StudentsOptional.test.tsx`

**Interfaces:**
- Produces: `StudentDto.course: {id,name} | null`, `StudentDto.year: SchoolYear | null`; web `Student.course: Pick<Course,'id'|'name'> | null`, `Student.year: SchoolYear | null`.

- [ ] **Step 1: Testes que falham**
  - `migrations.test.ts`: a migration `20261109000100_student_optional_course` contém `ALTER COLUMN "course_id" DROP NOT NULL` e `ALTER COLUMN "year" DROP NOT NULL`.
  - API `cadastra aluno sem curso e sem série`: POST multipart sem `courseId`/`year` → 201 e `prisma.student.create` chamado com `courseId: null, year: null`; `ensureCourse` não consulta curso.
  - API `recusa curso de outra escola` **[RF 5]**: `courseId` com `prisma.course.findFirst` → `null` → 400 `INVALID_COURSE`.
  - Web: aluno com `course: null, year: null` aparece na lista com "—" nas colunas Série e Curso; o formulário salva sem curso (opção "Sem curso") e sem série (opção "Sem série").
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** schema: `year: z.enum(SchoolYear).nullish().transform(v => v ?? null)`, `courseId` idem com `z.coerce.number().int().positive()` aceitando `''` como vazio. Service: só chama `ensureCourse` com curso informado. Web: validação do formulário deixa de exigir curso/série; `VerificationPage` mostra "—". OpenAPI: tira `year` e `courseId` de `required`, marca `nullable`.
- [ ] **Step 4:** `npm test` (api e web) e `npm run typecheck` → PASS.
- [ ] **Step 5: Commit** `feat: curso e série opcionais no cadastro de aluno`

### Task 3: Disciplinas (API)

**Files:**
- Create: `apps/api/src/modules/subjects/subjects.service.ts`, `subjects.routes.ts`
- Modify: `apps/api/src/app.ts` (`app.use('/api/subjects', ...scoped, subjectsRoutes(new SubjectsService(prisma)))`)
- Test: `apps/api/tests/subjects.test.ts`

**Interfaces:**
- Produces: `subjectSchema` `{ name: 1–60, abbreviation: 1–8, color: /^#[0-9a-fA-F]{6}$/ }`; `SubjectsService.list/create/update/remove(schoolId, …)`; `SubjectsService.findOwned(schoolId, id)` (pública, reaproveitada nas Tasks 6–7); lista devolve `{ id, name, abbreviation, color }` ordenada por nome.

- [ ] **Step 1: Testes** (padrão de `courses.test.ts`): lista só da escola; cria com nome aparado; 400 `Preencha o campo nome`; 400 para cor `azul`; 409 `SUBJECT_EXISTS` (nome igual, sem diferenciar maiúsculas); 404 para id de outra escola; DELETE com uso (`teachingAssignment.count > 0` ou `timetableSlot.count > 0`) → 409 `SUBJECT_IN_USE`; DELETE sem uso → 204.
- [ ] **Step 2:** FAIL → **Step 3:** implementar no molde de `CoursesService` → **Step 4:** `npm test -w apps/api -- subjects` PASS.
- [ ] **Step 5: Commit** `feat(api): cadastro de disciplinas`

### Task 4: Professores (API)

**Files:**
- Create: `apps/api/src/modules/teachers/teachers.service.ts`, `teachers.routes.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/teachers.test.ts`

**Interfaces:**
- Produces: `teacherSchema` `{ name: 2–100, contactEmail?: email ≤120 | '' → null }`; `TeachersService.findOwned(schoolId, id)`; lista `{ id, name, contactEmail, assignmentsCount }`.

- [ ] **Step 1: Testes:** lista só da escola; cria; 400 `Informe o nome do professor`; 400 e-mail inválido; DELETE com atribuições → 409 `TEACHER_IN_USE`; 404 de outra escola. Nomes repetidos são permitidos (dois "João Silva").
- [ ] **Steps 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(api): cadastro de professores`

### Task 5: Turmas (API: CRUD)

**Files:**
- Create: `apps/api/src/modules/class-groups/class-groups.schemas.ts`, `class-groups.service.ts`, `class-groups.routes.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/tests/class-groups.test.ts`

**Interfaces:**
- Consumes: `currentSchoolYear()` (Task 1).
- Produces: `classGroupSchema` `{ name: 1–40, schoolYear: int 2000–2100, shift: Shift, courseId?: int | null }`; `ClassGroupsService.findOwned(schoolId, id)`; lista `{ id, name, schoolYear, shift, course: {id,name}|null, studentsCount }` (studentsCount = matrículas com `endDate: null`); `GET :id` = item + `assignments: [{ subject: {id,name,abbreviation,color}, teacher: {id,name} }]`.

- [ ] **Step 1: Testes:** lista filtra `schoolYear` (sem query = ano atual em SP); cria sem curso; 400 `INVALID_COURSE` para curso de outra escola **[RF 5]**; 409 `CLASS_GROUP_EXISTS` (mesmo nome no mesmo ano, case-insensitive); mesmo nome em ano diferente → 201; DELETE com qualquer matrícula (aberta ou fechada) → 409 `CLASS_GROUP_HAS_STUDENTS`; DELETE sem matrícula → 204.
- [ ] **Steps 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(api): cadastro de turmas`

### Task 6: Alunos na turma e atribuições (API)

**Files:**
- Create: `apps/api/src/modules/class-groups/enrollments.service.ts`, `assignments.service.ts`
- Modify: `class-groups.routes.ts`
- Test: `apps/api/tests/enrollments.test.ts`, `apps/api/tests/assignments.test.ts`

**Interfaces:**
- Consumes: `ClassGroupsService.findOwned`, `SubjectsService.findOwned`, `TeachersService.findOwned`, `todayInSaoPaulo`, `dateOnly`.
- Produces: `EnrollmentsService.list(schoolId, classGroupId)` → `[{ id, name, rm, enrolledSince }]`; `.add(schoolId, classGroupId, studentIds) → { added: number, moved: number }`; `.remove(schoolId, classGroupId, studentId)`. `AssignmentsService.set(schoolId, classGroupId, subjectId, teacherId)`, `.remove(schoolId, classGroupId, subjectId)`.

Regra de matrícula (em `$transaction`), para cada aluno e hoje = `todayInSaoPaulo()`:
- já tem matrícula aberta nesta turma → ignora;
- tem matrícula aberta em outra turma do mesmo `schoolYear`: se `startDate == hoje`, troca o `classGroupId` dela; senão, `endDate = hoje` e cria nova `startDate = hoje` (conta em `moved`);
- não tem → cria (conta em `added`).
Retirar: matrícula aberta nesta turma; `startDate == hoje` → apaga; senão `endDate = hoje`; sem matrícula aberta → 404.

- [ ] **Step 1: Testes:**
  - matricula 2 alunos novos → `{ added: 2, moved: 0 }`;
  - **[RF 1]** transfere aluno matriculado ontem → `enrollment.update` com `endDate` de hoje + `create` com `startDate` de hoje; aluno matriculado hoje → `update` de `classGroupId`, sem `create`;
  - **[RF 5]** `studentIds` com aluno de outra escola → 400 `INVALID_STUDENT` e nada gravado;
  - retirar matriculado hoje → `delete`; matriculado antes → `endDate` de hoje;
  - atribuição: `PUT` cria ou troca o professor (upsert por `classGroupId_subjectId`); professor/disciplina de outra escola → 400 `INVALID_TEACHER`/`INVALID_SUBJECT` **[RF 5]**;
  - **[RF 4]** `DELETE` atribuição com a disciplina num slot da versão vigente → 409 `ASSIGNMENT_IN_USE`; sem uso → 204.
- [ ] **Steps 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(api): alunos nas turmas e professores por disciplina`

### Task 7: Grade semanal (API)

**Files:**
- Create: `apps/api/src/modules/class-groups/timetable.rules.ts`, `timetable.service.ts`
- Modify: `class-groups.schemas.ts`, `class-groups.routes.ts`
- Test: `apps/api/tests/timetable.rules.test.ts`, `apps/api/tests/timetable.test.ts`

**Interfaces:**
- Consumes: `AssignmentsService`/Prisma, `todayInSaoPaulo`, `dateOnly`.
- Produces:
  - `timetableBlockSchema`, `timetableSchema = { blocks: Block[] (máx. 200) }`; `STEP_MINUTES = 5`.
  - `findOverlaps(blocks: Pick<Block,'weekday'|'startMinute'|'endMinute'>[]): [number, number][]` — pares de índices que se sobrepõem no mesmo dia (encostar, fim == início, não é sobreposição).
  - `findTeacherConflicts(mine: TeacherBlock[], others: (TeacherBlock & { classGroupName: string })[]): TeacherConflict[]` com `TeacherBlock = { teacherId, teacherName, weekday, startMinute, endMinute }`.
  - `TimetableService.current(schoolId, classGroupId, on?: string)`, `.save(schoolId, classGroupId, blocks)` → resposta da grade (formato na seção API).

- [ ] **Step 1: Testes das regras (puros):** sobreposição parcial, contido, encostado (não), dias diferentes (não); conflito de professor só quando mesmo `teacherId`, mesmo dia e horários sobrepostos.
- [ ] **Step 2: Testes do serviço:**
  - **[RF 3]** 400 para `endMinute <= startMinute`, `startMinute: 452`, `endMinute: 1445`, `weekday: 7`, `LESSON` sem `subjectId`, `BREAK` com `subjectId`;
  - 400 `TIMETABLE_OVERLAP` com dois blocos sobrepostos, sem gravar;
  - 400 `SUBJECT_NOT_ASSIGNED` para disciplina sem atribuição na turma;
  - **[RF 2]** sem versão de hoje → `timetableVersion.create({ validFrom: hoje })` + slots; já existe versão de hoje → `timetableSlot.deleteMany({ versionId })` e recria os slots na mesma versão, sem novo `create` de versão;
  - `warnings` lista conflito com outra turma do mesmo `schoolYear` e escola (via versão vigente das outras turmas), e o save conclui (200);
  - `GET` sem versão → `{ validFrom: null, blocks: [], warnings: [] }`; com versões em 2026-02-01 e 2026-05-01 e hoje 2026-04-10 → devolve a de fevereiro.
- [ ] **Steps 3–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(api): grade semanal versionada por vigência`

### Task 8: Copiar turmas do ano anterior + OpenAPI

**Files:**
- Modify: `class-groups.service.ts`, `class-groups.routes.ts`, `apps/api/src/docs/openapi.ts`
- Test: `apps/api/tests/class-groups.test.ts`, `apps/api/tests/docs.test.ts`

**Interfaces:**
- Produces: `ClassGroupsService.copyYear(schoolId, fromYear, toYear) → { created: number, skipped: string[] }`.

- [ ] **Step 1: Testes:** copia nome, turno, curso, atribuições e a grade vigente (nova versão com `validFrom` = hoje), sem matrículas; pula turmas cujo nome já existe em `toYear` (lista em `skipped`); `fromYear === toYear` → 400 `INVALID_YEAR`; `docs.test.ts` passa a exigir os paths `/api/subjects`, `/api/subjects/{id}`, `/api/teachers`, `/api/teachers/{id}`, `/api/class-groups`, `/api/class-groups/{id}`, `/api/class-groups/copy`, `/api/class-groups/{id}/students`, `/api/class-groups/{id}/students/{studentId}`, `/api/class-groups/{id}/assignments/{subjectId}`, `/api/class-groups/{id}/timetable`.
- [ ] **Steps 2–4:** FAIL → implementar (cópia inteira em um `$transaction`) e documentar todas as rotas das Tasks 3–8 → PASS; `npm run lint && npm run typecheck` verdes.
- [ ] **Step 5: Commit** `feat(api): copiar turmas do ano anterior e documentação`

### Task 9: Web — cliente da API, Disciplinas e Professores

**Files:**
- Modify: `apps/web/src/api/types.ts`, `apps/web/src/api/index.ts`, `apps/web/src/App.tsx`, `apps/web/src/components/AppLayout.tsx`, `apps/web/src/components/Icons.tsx`
- Create: `apps/web/src/pages/SubjectsPage.tsx`, `apps/web/src/pages/TeachersPage.tsx`, `apps/web/src/utils/academic.ts`
- Test: `apps/web/tests/AcademicPages.test.tsx` (mock da API no padrão de `AdminPages.test.tsx`)

**Interfaces:**
- Produces: `subjectsApi`, `teachersApi`, `classGroupsApi` (todas as rotas da seção API); tipos `Subject`, `Teacher`, `ClassGroup`, `ClassGroupDetail`, `Shift`, `TimetableBlock`, `Timetable`, `TeacherConflict`; `SHIFT_LABELS: Record<Shift,string>` = `{ MORNING:'Manhã', AFTERNOON:'Tarde', EVENING:'Noite', FULL_TIME:'Integral' }`; `WEEKDAY_LABELS = ['Seg','Ter','Qua','Qui','Sex','Sáb']` (índice = weekday−1); `formatMinute(m): 'HH:MM'`.
- Menu (`NAV_ITEMS`, após Cursos): Turmas `/turmas`, Disciplinas `/disciplinas`, Professores `/professores`; rotas dentro de `<RequireSchool>` como `/cursos`.

- [ ] **Step 1: Testes:** Disciplinas lista e cria (nome, sigla, cor via `<input type="color">`), mostra a mensagem do 409 `SUBJECT_IN_USE` ao excluir; Professores lista, cria, edita; itens do menu visíveis para login de escola; `formatMinute(450) === '07:30'`.
- [ ] **Steps 2–4:** FAIL → implementar no molde de `CoursesPage` → PASS.
- [ ] **Step 5: Commit** `feat(web): telas de disciplinas e professores`

### Task 10: Web — Turmas e detalhe da turma

**Files:**
- Create: `apps/web/src/pages/ClassGroupsPage.tsx`, `apps/web/src/pages/ClassGroupPage.tsx`
- Modify: `apps/web/src/App.tsx` (`/turmas`, `/turmas/:id`), `apps/web/src/styles/global.css`
- Test: `apps/web/tests/ClassGroups.test.tsx`

**Interfaces:**
- Consumes: `classGroupsApi`, `studentsApi.list`, `subjectsApi.list`, `teachersApi.list`, `SHIFT_LABELS`.
- Produces: `ClassGroupPage` com três abas: **Alunos**, **Disciplinas e professores**, **Grade** (a aba Grade renderiza `<TimetableEditor classGroup={…} />` da Task 11; até lá, um placeholder).

- [ ] **Step 1: Testes:**
  - lista de turmas com seletor de ano letivo (padrão: ano atual), mostra turno e nº de alunos; cria turma sem curso;
  - "Copiar do ano anterior" chama `copy({ fromYear: ano−1, toYear: ano })` e mostra "N turmas copiadas" e, se houver, os nomes pulados;
  - aba Alunos: busca alunos da escola, adiciona selecionados; mostra o toast "1 aluno transferido de outra turma" quando `moved > 0`; retira aluno pedindo confirmação (`ConfirmDialog`);
  - aba Disciplinas e professores: escolhe disciplina + professor e salva; mostra a mensagem do 409 `ASSIGNMENT_IN_USE`.
- [ ] **Steps 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(web): turmas, alunos da turma e professores por disciplina`

### Task 11: Web — editor da grade (agenda livre)

**Files:**
- Create: `apps/web/src/components/timetable/timetableReducer.ts`, `TimetableEditor.tsx`, `TimetableGrid.tsx`, `apps/web/src/hooks/useMediaQuery.ts`
- Modify: `apps/web/src/pages/ClassGroupPage.tsx`, `apps/web/src/styles/global.css`
- Test: `apps/web/tests/timetableReducer.test.ts`, `apps/web/tests/TimetableEditor.test.tsx`

**Interfaces:**
- Consumes: `classGroupsApi.timetable/saveTimetable`, `ClassGroupDetail.assignments`, `formatMinute`, `WEEKDAY_LABELS`.
- Produces:
  - `type EditorBlock = { key: string; kind: 'LESSON'|'BREAK'; subjectId: number|null; weekday: number; startMinute: number; endMinute: number }`
  - `timetableReducer(state: EditorBlock[], action)` com ações `place {kind, subjectId, weekday, minute}` (aula padrão 50 min, intervalo padrão 20 min), `move {key, weekday, minute}` (mantém a duração), `resize {key, edge:'start'|'end', minute}` (duração mínima 5), `setTimes {key, startMinute, endMinute}`, `remove {key}`, `replace {blocks}`. Todo minuto passa por `snap(m) = Math.round(m/5)*5` e é limitado a 0–1440.
  - `overlappingKeys(blocks): Set<string>` (mesma regra de `findOverlaps` da API).
  - `visibleRange(shift, blocks): { from, to }` — base por turno MORNING 07:00–13:00, AFTERNOON 12:00–19:00, EVENING 18:00–23:30, FULL_TIME 07:00–18:00, ampliada para conter todos os blocos, arredondada para a hora cheia.

Comportamento do editor:
- Paleta à esquerda com as disciplinas **atribuídas** à turma (cor, sigla) e o item "Intervalo".
- Colunas Seg–Sex; Sáb aparece se houver bloco no sábado ou se a escola ligar "Mostrar sábado".
- Arrastar da paleta para a coluna cria o bloco no minuto do ponto solto; arrastar o bloco move; puxador na borda inferior (e superior) redimensiona — tudo via pointer/drag events chamando o reducer.
- Alternativa acessível e testável: clicar num item da paleta e depois numa faixa da coluna também cria; clicar no bloco abre um popover com campos Início/Fim (`<input type="time" step="300">`) e "Remover".
- Blocos sobrepostos ficam destacados e o botão **Salvar grade** fica desativado com o aviso "Há aulas sobrepostas".
- "Copiar grade de outra turma": escolhe uma turma do mesmo ano, carrega a grade dela no editor (`replace`), descartando aulas de disciplinas sem atribuição nesta turma e avisando quantas foram descartadas.
- Depois de salvar, mostra os `warnings` como avisos "Profª Ana também está em 2º DS B na Seg 07:30–08:20".
- `useMediaQuery('(max-width: 899px)')` verdadeiro → só leitura (sem paleta, sem arrastar, sem salvar) com a nota "Para editar a grade, use uma tela maior."

- [ ] **Step 1: Testes do reducer:** `place` aula em 07:32 → bloco 07:30–08:20; `resize end` para 08:47 → 08:45; `resize` não deixa fim ≤ início; `move` mantém a duração e não passa de 24:00; `overlappingKeys` marca só os dois sobrepostos; `visibleRange('MORNING', [bloco 13:10–14:00])` → `{ from: 420, to: 840 }`.
- [ ] **Step 2: Testes do componente:** paleta só com disciplinas atribuídas; clique na paleta + clique na coluna Seg cria o bloco e "Salvar grade" envia `{ blocks: [{ kind:'LESSON', subjectId, weekday:1, startMinute, endMinute }] }`; com sobreposição o botão fica desativado; aviso de conflito do retorno aparece; com `matchMedia` simulando tela estreita, não há paleta nem botão Salvar.
- [ ] **Steps 3–4:** FAIL → implementar → PASS; `npm test`, `npm run lint`, `npm run typecheck`, `npm run build -w apps/web` verdes.
- [ ] **Step 5: Commit** `feat(web): editor da grade semanal com arrastar e soltar`
