# Permissões por usuário (Super Admin, Escola, Usuários) — Design

Data: 2026-11-07 · Projeto: HelpUs (AccessControl — `apps/api` + `apps/web`)

## Intenção

Hoje cada login **é** uma escola: `schools.auth_user_id` liga a escola ao Supabase Auth e toda
requisição é filtrada pelo `schoolId` de quem está logado (`currentSchool(res).sub`). Não existe
conceito de usuário nem de permissão.

O dono do projeto (rafaelhenriqueoliveira1234@gmail.com) precisa de um perfil **Super Admin** com
poder total sobre todas as escolas, e o projeto vai crescer para que alunos, funcionários e
professores tenham login próprio. Para isso o login passa a ser um **usuário** com um **perfil
(role)**, que pode pertencer a uma escola.

## Perfis

| Perfil | Quem | O que pode |
|---|---|---|
| `SUPER_ADMIN` | Dono do projeto e quem ele promover | Tudo, em todas as escolas, sem restrição |
| `SCHOOL` | A instituição. **Um login por escola**, compartilhado pela secretaria, guarda da catraca etc. | Tudo dentro da própria escola (comportamento atual) |
| `STUDENT`, `EMPLOYEE`, `TEACHER` | Futuro | **Fora do escopo agora** — só existem no enum |

Escola = a mesma entidade que matricula os alunos e opera a catraca (não há "empresa
verificadora" separada). O guarda usa o mesmo login da escola; não haverá conta restrita de operador.

## Objetivos

1. Tabela de usuários com perfil, ligada ao Supabase Auth, substituindo o vínculo direto escola↔login.
2. Promover o usuário rafaelhenriqueoliveira1234@gmail.com a `SUPER_ADMIN`, mantendo a escola dele
   como **escola de teste vinculada ao usuário** (abre por padrão ao logar).
3. Super Admin escolhe a escola num **seletor** e todas as telas atuais (Dashboard, Alunos, Cursos,
   Verificação, Entradas, Configurações) operam sobre a escola escolhida: cadastrar, editar,
   excluir, registrar entradas manuais e por digital.
4. Opção **"Todas as escolas"** no seletor, válida nas telas de **Entradas** (lista + exportação CSV)
   e **Dashboard**, mostrando a escola de cada registro.
5. Tela **Escolas** (só Super Admin): listar, cadastrar, editar, excluir escolas.
6. Tela **Usuários** (só Super Admin): listar usuários e alterar o perfil (promover a Super Admin /
   rebaixar).
7. Cadastro público continua aberto, com escolha inicial **"Sou uma escola"** / **"Sou um usuário"**;
   a segunda aparece como **"em breve"** (desabilitada).

## Não-objetivos

- Login e telas para aluno/funcionário/professor (apenas o enum e a estrutura ficam prontos).
- Múltiplos logins por escola ou perfis de operador limitados.
- Permissões granulares por recurso (ACL). São só perfis fixos.
- Log de auditoria das ações do Super Admin.

## Anti-objetivos (seria falha mesmo funcionando)

- Perfil guardado em `user_metadata` do Supabase ou qualquer lugar editável pelo próprio usuário.
  `user_metadata` é gravável pelo cliente; o perfil vive **só** no nosso banco.
- Um usuário `SCHOOL` conseguir ler/alterar dados de outra escola (ex.: forjando o cabeçalho de escola).
- Escolas existentes perderem o acesso ou os dados na migração.
- O sistema ficar sem nenhum Super Admin (rebaixar o último, ou a si mesmo).

## Modelo de dados

Novo enum e tabela (Prisma, `apps/api/prisma/schema.prisma`):

```prisma
enum UserRole {
  SUPER_ADMIN
  SCHOOL
  STUDENT
  EMPLOYEE
  TEACHER
}

model User {
  id         Int      @id @default(autoincrement())
  authUserId String   @unique @map("auth_user_id") @db.Uuid
  email      String   @unique @db.VarChar(120)
  name       String   @db.VarChar(100)
  role       UserRole @default(SCHOOL)
  /// Escola do usuário. Para SCHOOL é obrigatória; para SUPER_ADMIN é a "escola padrão" (opcional).
  schoolId   Int?     @map("school_id")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  school School? @relation(fields: [schoolId], references: [id], onDelete: SetNull)

  @@index([schoolId])
  @@map("users")
}
```

`School`: remove `authUserId`; ganha `users User[]`. `email` continua (contato da escola e chave para
vincular o primeiro login, ver "Provisionamento").

### Migração (uma migration Prisma com SQL de dados)

1. Cria enum e tabela `users`.
2. Para cada escola com `auth_user_id` preenchido, insere um `users` com `role = SCHOOL`,
   mesmo `auth_user_id`, `email`, `name` e `school_id`.
3. `UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'rafaelhenriqueoliveira1234@gmail.com'`
   (o `school_id` continua apontando para a escola dele = escola de teste). Em ambientes onde esse
   e-mail não existe, o UPDATE não afeta nada.
4. Remove `schools.auth_user_id`.

Se o e-mail ainda não tiver feito login (sem `auth_user_id`), o passo 3 não promove ninguém. Por
isso o provisionamento também promove esse e-mail (ver abaixo). Antes de aplicar em produção,
conferir no Supabase se o usuário já está vinculado.

## Backend (API)

### Autenticação e contexto

`createRequireAuth` passa a resolver um **usuário** e grava em `res.locals.auth`:

```ts
interface AuthContext {
  userId: number;
  role: UserRole;
  name: string;
  email: string;
  /** Escola "dona" do usuário (SCHOOL) ou escola padrão (SUPER_ADMIN). */
  homeSchoolId: number | null;
}
```

### Escola em uso (escopo)

Novo middleware `requireSchoolScope` (aplicado em courses, students, access-logs, stats). Ele
resolve a escola sobre a qual a requisição opera, a partir do cabeçalho **`X-School-Id`**:

| Perfil | Cabeçalho | Resultado |
|---|---|---|
| `SCHOOL` | ausente ou igual à própria escola | própria escola |
| `SCHOOL` | outro valor | **403** |
| `SUPER_ADMIN` | id de uma escola | essa escola (404 se não existir) |
| `SUPER_ADMIN` | ausente | escola padrão do usuário; se não tiver, 400 "selecione uma escola" |
| `SUPER_ADMIN` | `all` | `null` = todas. Só aceito nas rotas de leitura marcadas (lista/exportação de entradas, stats). Nas demais, 400 |
| demais perfis | qualquer | 403 (ainda sem acesso ao painel) |

`currentSchool(res)` continua existindo e devolve `{ id: number }` da escola em uso. Assim os
serviços atuais mudam pouco. Nas rotas que aceitam "todas", os serviços recebem `schoolId: number | null`
e omitem o filtro quando é `null`. Respostas de entradas em modo "todas" incluem `school: { id, name }`;
o CSV ganha a coluna "Escola".

### Provisionamento (primeiro login)

`AuthService.authenticate` busca `users` por `authUserId`. Se não existe:
1. Confere e-mail confirmado (como hoje).
2. Se existe `School` com esse e-mail **sem usuário SCHOOL vinculado**, cria o `User(SCHOOL)` ligado a ela
   (esse é o caminho das escolas criadas pelo Super Admin).
3. Senão, cria `School` + `User(SCHOOL)` (auto-cadastro, como hoje).
4. Se o e-mail for rafaelhenriqueoliveira1234@gmail.com, o usuário nasce `SUPER_ADMIN` (garante o
   bootstrap mesmo sem login anterior). O e-mail fica numa constante/variável de ambiente
   `SUPER_ADMIN_BOOTSTRAP_EMAIL`, não espalhado no código.

Por enquanto o cadastro só cria escolas. O tipo de conta vai em `user_metadata.account_type = 'school'`
apenas como informação; o servidor **não** confia nele para definir o perfil.

### `/api/auth/me`

Passa a devolver `{ id, name, email, role, school: { id, name } | null }`.

### Rotas novas (só `SUPER_ADMIN`, via middleware `requireRole('SUPER_ADMIN')`)

- `GET /api/schools`: lista com contadores (alunos, cursos, entradas). Também alimenta o seletor.
- `POST /api/schools` `{ name, email }`: cria a escola. Quem se cadastrar depois com esse e-mail é
  vinculado a ela (provisionamento, passo 2). Sem envio de convite por e-mail nesta etapa.
  Retorna **409** se o e-mail já pertence a outra escola ou a um `users` existente.
- `PUT /api/schools/:id` `{ name, email }`: o e-mail da escola é só contato e chave do primeiro
  vínculo. Mudá-lo **não** altera `users.email` nem o login no Supabase. Mesmo 409 do POST.
- `DELETE /api/schools/:id`: apaga em cascata cursos, alunos, fotos e entradas (cascata já existe).
  Antes de apagar no banco, remove do storage (`PhotoStorage.remove`) as fotos dos alunos da escola,
  sem travar a exclusão: falhas são logadas e a exclusão segue. Motivo: não deixar fotos de alunos
  órfãs no bucket (LGPD).
  Usuários `SCHOOL` dessa escola são apagados da tabela `users` (a conta no Supabase continua; se a
  pessoa logar de novo, cai no auto-cadastro). Usuários `SUPER_ADMIN` ficam com `schoolId = null`.
  O frontend exige confirmação digitando o nome da escola.
- `GET /api/users?search=&role=`: lista com escola.
- `PATCH /api/users/:id` `{ role }`: só alterna entre `SCHOOL` e `SUPER_ADMIN` nesta etapa. Bloqueia
  rebaixar a si mesmo e rebaixar o último Super Admin (409). Ao rebaixar para `SCHOOL`, o usuário
  precisa ter `schoolId`; se não tiver, 400.
- **No máximo um usuário `SCHOOL` por escola**: índice único parcial
  (`CREATE UNIQUE INDEX ... ON users(school_id) WHERE role = 'SCHOOL'`, via SQL na migration).
  Rebaixar para `SCHOOL` numa escola que já tem login de escola → 409. Promover o login
  compartilhado de uma escola é permitido, mas a tela de Usuários avisa antes que a escola ficará
  sem login próprio e que todos que usam aquela conta (guarda, secretaria) ganham poder total.

A troca de perfil vale na próxima requisição, porque o perfil é lido do banco a cada request.

### Testes

Segue o padrão atual (Vitest/Jest + `buildTestApp` com Prisma mockado e `FakeIdentity`). Cobrir no mínimo:
escopo por perfil (tabela acima, incluindo SCHOOL forjando `X-School-Id` → 403), `all` aceito só nas
rotas de leitura, provisionamento (vincular escola existente, auto-cadastro, bootstrap do super admin),
regras do último Super Admin, CRUD de escolas restrito ao perfil. `helpers.ts` passa a mockar
`prisma.user.findUnique` em vez de `school.findUnique`.

## Frontend (web)

- `AuthContext`: `school` vira `user` (com `role` e `school`). Expõe `isSuperAdmin`.
- **Escola em uso**: novo contexto `SchoolScopeContext` com `selectedSchoolId: number | 'all'`,
  inicializado com a escola padrão do usuário e lembrado no `localStorage`. `api/client.ts` envia
  `X-School-Id` em toda requisição quando o usuário é Super Admin. Ao trocar de escola, as telas
  recarregam os dados.
- **Seletor** no topo do `AppLayout`, visível só para Super Admin: lista de escolas + "Todas as
  escolas". Em telas que não suportam "todas" (Alunos, Cursos, Verificação, Configurações), mostrar
  um aviso pedindo para escolher uma escola em vez de chamar a API.
- Navegação ganha **Escolas** e **Usuários** (só Super Admin), com rotas `/escolas` e `/usuarios`,
  protegidas também no roteamento.
- **Leitor de digital**: cada leitor físico pertence a uma escola (decisão do usuário). O Super
  Admin só usa o leitor estando fisicamente na escola, com ela selecionada. Na Verificação e no
  cadastro de digital, mostrar em destaque para qual escola o leitor está registrando. Se a escola
  for trocada no seletor com o leitor conectado, avisar com um toast. Não há vínculo
  leitor↔escola no banco nesta etapa.
- **Entradas/Dashboard** em modo "todas": coluna/etiqueta com o nome da escola.
- **Cadastro** (`RegisterPage`): primeiro passo com dois cartões, "Sou uma escola" (fluxo atual) e
  "Sou um usuário" (aluno, funcionário, professor), este desabilitado com selo "em breve".
- Visual seguindo os componentes existentes (`PageHeader`, `Drawer`, `ConfirmDialog`, toasts).

## Decisões do usuário

- Escola e entidade verificadora são a mesma organização; um login por escola, compartilhado.
- Super Admin com poder total em todas as escolas, operando por seletor de escola.
- O e-mail rafaelhenriqueoliveira1234@gmail.com vira Super Admin e mantém a própria escola como escola de teste.
- Auto-cadastro de escola continua; o cadastro oferece "Sou uma escola" / "Sou um usuário (em breve)".
- Novos Super Admins são promovidos pela tela de Usuários; existe também a tela de Escolas.
- Cada leitor de digital pertence a uma escola.

## Decisões do designer (podem ser revistas)

- Perfil numa tabela `users` própria (não em metadados do Supabase).
- Escola em uso enviada pelo cabeçalho `X-School-Id`, em vez de prefixar as rotas com `/schools/:id`,
  para mexer pouco nas rotas atuais.
- "Todas as escolas" só em Entradas e Dashboard.
- Escola criada pelo Super Admin fica aguardando o cadastro com o mesmo e-mail (sem convite por e-mail).
- Regras de exclusão de escola e de proteção do último Super Admin descritas acima.
- Bootstrap do Super Admin por migration + e-mail configurável no provisionamento.
- Um login `SCHOOL` por escola garantido no banco; promover login compartilhado só com aviso.
- E-mail duplicado ao criar/editar escola → 409; e-mail da escola não altera o login.
- Exclusão de escola também apaga as fotos do storage (falhas só logadas).

## Deixado para quem implementar

- Nomes de arquivos/módulos (`modules/schools`, `modules/users`), schemas Zod, paginação das listas.
- Atualizar `openapi.ts` com as rotas e o cabeçalho novos.
- Layout exato do seletor e das telas novas, dentro do estilo atual.
