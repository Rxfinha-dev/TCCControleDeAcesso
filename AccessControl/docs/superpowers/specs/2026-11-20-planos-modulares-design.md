# Planos modulares por escola — Design

Data: 2026-11-20 · Projeto: HelpUs (AccessControl — `apps/api` + `apps/web`)

## Intenção

Hoje toda escola enxerga o sistema inteiro. O projeto passa a ser vendido em **planos**: cada
escola tem um plano, e o plano define quais módulos ela pode usar. Ainda **não há cobrança**: o
super admin escolhe o plano de cada escola manualmente, numa tela própria. A escola não pode acessar
(nem pela tela, nem pela API) o que o plano não libera.

## Planos (escada)

Os planos são incrementais: cada um contém todos os anteriores.

| Nível (`SchoolPlan`) | Módulo novo (`Module`) | O que libera |
|---|---|---|
| `BASIC` | `ACCESS` | Alunos (cadastro, foto, digital), cursos, turmas (dados da turma + aba **Alunos** / matrículas), entradas, verificação, início, configurações (Arduino e conta) |
| `ACADEMIC` | `ACADEMIC` | Disciplinas, professores, turmas › abas **Disciplinas** e **Grade**, calendário |
| `ATTENDANCE` | `ATTENDANCE` | Presença, alertas de frequência, atestados, frequência mínima, código e logins de **professor** |
| `ASSESSMENTS` | `ASSESSMENTS` | Avaliações, notas, sistema de notas, boletim, logins e painel do **aluno** |

Ex.: plano `ATTENDANCE` = módulos `ACCESS`, `ACADEMIC`, `ATTENDANCE`.

## Objetivos

1. Campo de plano por escola no banco; escolas existentes ficam em `ASSESSMENTS` (nada muda para elas).
2. Toda rota de um módulo recusa (403, código `MODULE_NOT_IN_PLAN`) quando a escola em uso não tem o módulo.
3. O front esconde menus, abas, seções e rotas fora do plano e mostra uma mensagem clara se o usuário
   cair numa delas (link antigo, favorito).
4. Tela do super admin para trocar o plano de uma escola, com confirmação ao rebaixar.

## Não-objetivos

- Motor de cobrança, preços, períodos de teste, vencimento.
- Módulos avulsos (fora da escada). O código fica preparado (ver "Abordagem"), o banco não.
- Planos com nome/conteúdo editáveis pela tela. A escada é fixa no código.
- Histórico/auditoria de trocas de plano (fica só o log de aplicação, ver "Segurança").
- Soft delete (exclusão recuperável) de alunos, turmas etc. — próximo projeto, com design próprio.

## Anti-objetivos (seria falha mesmo funcionando)

- **Bloqueio só no front.** Qualquer rota de módulo acessível pela API com plano menor é falha.
- **Rebaixar apagar dados.** Dados ficam intactos e voltam ao religar o plano.
- A escola (perfil `SCHOOL`) conseguir mudar o próprio plano.
- Escolas existentes perderem acesso no deploy.
- Combinação inválida (ex.: avaliações sem frequência). Impossível por construção.

## Abordagem

Consideradas:

- **A. Nível do plano + verificação por módulo (escolhida).** Um enum `plan` na escola; uma função
  única `modulesOf(plan)`; rotas e telas perguntam "tem o módulo X?", nunca "nível ≥ 3". Se um dia
  existirem avulsos, muda só `modulesOf` e o armazenamento — nenhuma rota ou tela.
- **B. Lista de módulos por escola com regras de dependência.** Pronta para avulsos, mas exige
  validar combinações, cascata na tela e mais testes. Descartada: paga hoje por algo sem previsão.
- **C. Um booleano por módulo na escola.** Combinações inválidas possíveis e migração a cada módulo.
  Descartada.

Escolhida pelo dono do projeto: **A**.

## Modelo de dados

`apps/api/prisma/schema.prisma`:

```prisma
/// Plano da escola. Escada: cada plano inclui os anteriores (ver lib/plans.ts).
enum SchoolPlan {
  BASIC
  ACADEMIC
  ATTENDANCE
  ASSESSMENTS
}

model School {
  // ...
  plan SchoolPlan @default(ASSESSMENTS)
}
```

O default no Prisma é `@default(BASIC)`. A migration cria a coluna com `DEFAULT 'ASSESSMENTS'` (preenche
as escolas existentes) e em seguida troca o default da coluna para `BASIC`.

**Escola nova começa em `BASIC`** (decidido), tanto no auto-cadastro quanto criada pelo super admin;
no formulário de criação o super admin pode escolher outro plano (`POST /api/schools` aceita `plan`
opcional).

## API

### `src/lib/plans.ts` (novo, fonte única da escada)

```ts
export const MODULES = ['ACCESS', 'ACADEMIC', 'ATTENDANCE', 'ASSESSMENTS'] as const;
export type Module = (typeof MODULES)[number];
// A ordem do enum SchoolPlan é a ordem da escada.
export function modulesOf(plan: SchoolPlan): Module[]
export function hasModule(plan: SchoolPlan, module: Module): boolean
```

Com teste unitário da escada.

### Guard `requireModule(module)` (em `middlewares/school-scope.ts`)

- Lê o plano da escola em uso e responde `403 MODULE_NOT_IN_PLAN`
  ("Este recurso não está incluído no plano da escola.") se faltar o módulo.
- **Sem consulta extra:** `requireSchoolScope` já tem a escola — para `SCHOOL`/`TEACHER` ela vem do
  `authenticate` (`include: { school: true }`); para super admin com cabeçalho, o `findUnique` passa a
  selecionar `plan`. O scope grava `res.locals.schoolPlan` junto com `schoolScope`. Para isso o
  `AuthContext` ganha `homeSchoolPlan: SchoolPlan | null`.
- Modo "todas as escolas" (`schoolScope === null`): só existe em entradas e estatísticas, que são
  `ACCESS` (todo plano tem). O guard deixa passar quando o módulo pedido é `ACCESS`; qualquer outro
  módulo com "todas" é recusado (não acontece hoje, mas falha fechado).
- O plano é relido do banco a cada requisição (como o perfil), então trocar o plano vale na hora.

### Onde cada guard entra (`src/app.ts` e rotas)

| Rota | Guard |
|---|---|
| `/api/courses`, `/api/students`, `/api/access-logs`, `/api/stats` | nenhum (`ACCESS`, todo plano) |
| `/api/class-groups` — CRUD, `/copy`, `/:id/students` | nenhum |
| `/api/class-groups/:id/assignments/*`, `/:id/timetable` | `ACADEMIC` (no router, por rota) |
| `/api/subjects`, `/api/teachers`, `/api/calendar` | `ACADEMIC` |
| `/api/attendance` | `ATTENDANCE` |
| `/api/assessments`, `/api/report-cards` | `ASSESSMENTS` |
| `/api/logins/teachers/:id` | `ATTENDANCE` |
| `/api/logins/students/:id` | `ASSESSMENTS` |
| `/api/logins/class-groups/:id` (gera logins de alunos da turma) | `ASSESSMENTS` |
| `/api/student/*` (painel do aluno, sem `requireSchoolScope`) | `ASSESSMENTS`, pelo `homeSchoolPlan` do aluno |
| `/api/settings` GET | nenhum; devolve só os campos dos módulos que a escola tem |
| `/api/settings` PUT | `minAttendance`/`code` exigem `ATTENDANCE`; `grading` exige `ASSESSMENTS` (403 por campo) |

**Efeitos colaterais dentro de serviços:** serviços chamam outros serviços (presença usa calendário,
boletim usa presença). Isso **não** é bloqueado — o guard fica só na borda HTTP. Como a escada
garante que quem tem o módulo de cima tem os de baixo, não existe caminho quebrado.

**Respostas de rotas liberadas não trazem dados de módulos bloqueados** (decidido). Se a resposta de
uma rota liberada incluir dados de um módulo fora do plano, esses campos são omitidos (ex.: detalhe
da turma sem atribuições/professores sem `ACADEMIC`; aluno/professor sem dados de login sem o módulo
do login). O plano de implementação lista cada DTO afetado e cada um ganha teste. Esta é a única
exceção à regra "guard só na borda": a rota passa o plano (`res.locals.schoolPlan`) para montar a
resposta.

**Cópia de ano (`POST /api/class-groups/copy`)** (decidido): sem `ACADEMIC`, copia só turma e
matrículas; atribuições e grade não são copiadas. Com `ACADEMIC`, comportamento atual. A rota passa
`hasModule(plan, 'ACADEMIC')` para o serviço.

**Exclusão de aluno/turma com dados ocultos** (decidido): a exclusão continua permitida e em cascata,
mas o diálogo de confirmação no front avisa que o histórico de presença, notas, atestados e grade
também serão apagados. Soft delete fica para um projeto seguinte, com design próprio (ver Não-objetivos).

### Escolas e `/auth/me`

- `GET/POST/PUT /api/schools` (super admin): DTO ganha `plan` e `modules`.
- Novo `PUT /api/schools/:id/plan` `{ plan }` (super admin), validado com `z.enum(SchoolPlan)`.
  Endpoint separado do `PUT /:id` para deixar a ação explícita e logada. Retorna a escola atualizada.
- `MeDto.school` ganha `plan` e `modules` (escola, professor, aluno usam isso no front).
- OpenAPI (`src/docs/`): documentar o campo, o endpoint novo e o erro `MODULE_NOT_IN_PLAN`.

## Front (`apps/web`)

- `hasModule(m)` exposto pelo `SchoolScopeContext` (já sabe a escola selecionada):
  - super admin: `modules` da escola selecionada (da lista `/api/schools`); em "todas as escolas",
    só `ACCESS`.
  - demais perfis: `me.school.modules`.
- `AppLayout`: cada item do menu ganha `module?`; itens sem o módulo somem.
- `App.tsx`: um `<RequireModule module="...">` envolve as rotas (como já existe `RequireSchool`);
  sem o módulo mostra um aviso "Este recurso não está incluído no plano da escola." em vez da tela.
- `ClassGroupPage`: abas Disciplinas e Grade só com `ACADEMIC`.
- `SettingsPage`: seção Frequência e código dos logins só com `ATTENDANCE`; `GradingForm` só com
  `ASSESSMENTS`.
- `DashboardPage`: `AttendanceAlerts` só com `ATTENDANCE`.
- Professor/aluno sem o módulo: menu vazio além de "Início"; a home mostra o aviso do plano.
- Cliente da API: o erro `MODULE_NOT_IN_PLAN` vira o mesmo aviso (caso de plano trocado com a tela aberta).
- **Tela de plano (super admin):** em `SchoolsPage`, ação "Plano" por escola abre um `Drawer` com a
  escolha de plano (rádios, cada um listando o que inclui). Rebaixar abre `ConfirmDialog` listando o
  que a escola deixa de acessar e dizendo que nenhum dado é apagado. Coluna "Plano" na tabela.

```
Escola: ETEC Jaú                          Plano atual: Frequência
 ○ Básico       Controle de acesso, alunos, turmas
 ○ Acadêmico    + disciplinas, professores, grade, calendário
 ● Frequência   + presença, atestados, login de professor
 ○ Avaliações   + notas, boletim, painel do aluno
                                   [Cancelar]  [Salvar plano]
```

## Segurança

- Autorização só no servidor; o front é conveniência. Guard por padrão nas montagens de rota em
  `app.ts`, para rota nova de um módulo herdar o bloqueio (não depender de lembrar em cada handler).
- Trocar plano: só `SUPER_ADMIN` (`requireRole`), entrada validada por enum. `PUT /api/schools/:id`
  **não** aceita `plan` (evita troca acidental por outro formulário).
- O plano nunca vem do cliente nem do token: é lido do banco a cada requisição.
- Log estruturado (`logger.info`) a cada troca: quem, escola, plano anterior → novo.
- Falha fechada: plano desconhecido ou escola sem plano ⇒ sem módulos além de `ACCESS`.
- Testes de segurança (`tests/security.test.ts` / novo `tests/plans.test.ts`): para cada módulo,
  uma rota representativa responde 403 com plano menor e 200 com o plano certo; `SCHOOL` recebe 403
  em `PUT /api/schools/:id/plan`; professor de escola `ACADEMIC` recebe 403 em `/api/attendance`;
  aluno de escola `ATTENDANCE` recebe 403 em `/api/student/*`.
- Revisão final com a skill `security-review` antes do PR.

## Testes

- Unitário de `modulesOf`/`hasModule`.
- Integração por módulo (acima), incluindo rotas mistas: `/class-groups/:id/students` liberada no
  `BASIC`, `/class-groups/:id/timetable` bloqueada; `PUT /settings` com `grading` no `ATTENDANCE` ⇒ 403.
- Cópia de ano no `BASIC` não cria atribuições nem grade; DTOs de rotas liberadas omitem campos de
  módulos bloqueados; escola criada sem `plan` nasce `BASIC`.
- Migration: escola existente fica `ASSESSMENTS` (`tests/migrations.test.ts`).
- Testes atuais continuam passando: o helper de criação de escola usa `ASSESSMENTS` por padrão.

## Decisões tomadas pelo autor do design (conferir)

- Super admin também respeita o plano da escola selecionada.
- Trocar plano é endpoint próprio (`PUT /api/schools/:id/plan`), não um campo do `PUT /:id`.
- Configurações: GET omite campos de módulos fora do plano; PUT recusa campo a campo.
- Logins de professor ficam em `ATTENDANCE`; logins de aluno (individual e por turma) em `ASSESSMENTS`.
- Guard por montagem de rota em `app.ts`; rotas mistas (turmas, logins, configurações) guardam por rota.

## Fica para o implementador

- Nomes exatos de componentes/arquivos, textos de interface, ordem das tarefas.
- Forma de expor `hasModule` no front, desde que siga a regra de super admin / demais perfis acima.
