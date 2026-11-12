# Módulo acadêmico: andamento

A especificação completa está em [`superpowers/specs/2026-11-08-modulo-academico-design.md`](superpowers/specs/2026-11-08-modulo-academico-design.md), que divide o módulo em 6 etapas (seção 10). Cada etapa vira uma branch e um PR para `develop`.

*Atualizado em 11/11/2026.*

## Resumo

| Etapa | O que entrega | Situação |
|---|---|---|
| 1 | Turmas, disciplinas, professores (só cadastro) e grade de arrastar | ✅ Mergeada (PR #39) |
| 2 | Calendário: feriados automáticos, dias sem aula, bimestres | 🟡 PR #41 aberto, aguardando merge |
| 3 | Presença automática pela catraca e correção manual | 🟡 PR #42 aberto (depende do #41) |
| 4 | Logins de professor e aluno, troca de senha, telas do professor | 🔧 **Em andamento** (branch `feat/academico-etapa4-logins`, sem commit) |
| 5 | Avaliações, sistema de notas e médias | ⏳ Não começada |
| 6 | Painel do aluno e boletim em PDF | ⏳ Não começada |

Os PRs estão empilhados: o #42 tem como base a branch do #41. Quando o #41 for mergeado e a branch dele apagada, o GitHub muda a base do #42 para `develop` sozinho. A etapa 4 também nasce da etapa 3, então o PR dela vai depender do #42.

Também está aberto o **PR #40** (develop → main). O merge em `main` dispara o deploy, que roda as migrations.

---

## Etapa 4: o ponto exato em que parei

### API: pronta

Os 273 testes da API passam. O typecheck da API passa.

- **Migração** `20261113000000_logins`, conferida com `prisma migrate diff`:
  - `schools.code`, o código curto e único da escola (ex.: `etec-jau`).
  - `users.username`, `users.must_change_password`, `users.teacher_id` e `users.student_id`, ligando o login ao cadastro.
- **Formato dos logins:**
  - Professor: `nome.sobrenome@código`; se o nome se repetir, vira `nome.sobrenome2@código`.
  - Aluno: `RM@código`.
  - No Supabase o login vira um e-mail sintético, `usuario@codigo.helpus.invalid`. O domínio `.invalid` é reservado e nunca recebe e-mail.
- **Rotas novas:**
  - `PUT /api/logins/teachers/:id` e `PUT /api/logins/students/:id`: criam o login ou geram uma senha nova. Sem senha no corpo, o sistema gera uma de 8 caracteres.
  - `POST /api/logins/class-groups/:id`: gera os logins da turma. Cada aluno é criado inteiro ou não é criado; a resposta lista os criados e os que falharam. Se o banco falhar, o usuário criado no Supabase é apagado.
  - `PUT /api/auth/password`: troca de senha pelo próprio usuário. Até trocar, as outras rotas respondem `PASSWORD_CHANGE_REQUIRED`.
  - `GET /api/attendance/my-lessons`: aulas do professor no dia.
  - `PUT /api/settings` aceita `code`. O código fica travado depois que a escola cria logins.
- **Permissões:**
  - O professor usa as rotas de presença, mas só vê e corrige as aulas das disciplinas dele. Não vê a frequência da turma.
  - Um login sintético sem usuário no banco não vira "escola nova" no primeiro acesso.
  - O super admin não troca o perfil de professor nem de aluno.
- OpenAPI atualizado.

### Web: escrita, mas ainda não verificada

Telas e mudanças já escritas (o typecheck do web passa):

- Login aceita "E-mail ou usuário" e traduz o usuário para o e-mail sintético.
- **Crie sua senha** (`ChangePasswordPage`): aparece antes de qualquer tela enquanto `mustChangePassword` for verdadeiro.
- **Início do professor** (`TeacherHomePage`): aulas de hoje, com o botão "Abrir chamada".
- O professor tem só dois itens no menu, Início e Chamada. As telas da escola mandam ele de volta ao início.
- A **Presença** no modo professor usa só as turmas dele e esconde a aba Frequência. Ela aceita `?turma=` e `?dia=` na URL.
- **Professores**: coluna "Login" e o bloco "Acesso ao sistema", com os botões Criar login / Gerar nova senha.
- **Turma, aba Alunos**: botão "Gerar logins da turma", coluna "Login" e a ação "Nova senha" por aluno.
- **Lista para imprimir** (`LoginSheet`): usuário e senha inicial, mostrados uma única vez, com CSS de impressão.
- **Configurações**: card "Código da escola".
- Correção de bug: ao voltar do login, a query string da URL se perdia. Agora é mantida.

**Onde parei:**

- Na última execução da suíte web inteira, 59 testes falharam, incluindo testes antigos (Calendário, Turmas, Presença…).
- O `Calendar.test.tsx` rodado sozinho passa (6 de 6). Ainda não sei se a causa é algo que mudei e que afeta todas as telas (o candidato mais provável é a reorganização das rotas em `App.tsx` ou o `AppLayout`) ou algo do ambiente de testes.
- Esse é o próximo passo: rodar um arquivo que falha com a saída completa e achar a causa.

### O que falta para fechar a etapa 4

1. Descobrir e corrigir as falhas da suíte web.
2. Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w apps/web` na raiz `AccessControl/`, tudo verde.
3. Olhar as telas novas no navegador (início do professor, troca de senha, lista para imprimir).
4. Fazer um commit único da etapa (sem `Co-Authored-By`), dar push e abrir o PR para `develop`, avisando que ele depende do #42.

### O que precisa ser configurado no deploy (etapa 4)

- **`SUPABASE_SERVICE_ROLE_KEY` na API.** Sem ela, criar logins responde `LOGINS_UNAVAILABLE`.
- **Ainda não testado contra o Supabase real:**
  - Se o Supabase aceita e-mails `.invalid`. Se recusar, basta trocar o sufixo em `apps/api/src/lib/logins.ts` e em `apps/web/src/api/auth.ts`.
  - Se a política de senha do projeto Supabase aceita senhas de 8 caracteres.

---

## Etapas que faltam

### Etapa 5: avaliações, notas e médias
- Avaliação (prova ou trabalho) com data, título, conteúdo e peso, por turma e disciplina.
- Quem cria: o professor, nas turmas e disciplinas dele; a escola, em qualquer uma.
- Sistema de notas da escola, numérico ou por conceito, nas Configurações.
- Lançamento de notas em lista pelo professor. Aluno sem nota fica "sem nota" e não entra na média.
- Médias bimestrais, semestrais e anual.
- Selo "Prova" na grade.

### Etapa 6: painel do aluno e boletim
- Painel do aluno (hoje ele vê "Em breve"):
  - grade da semana, com selo nas aulas com prova;
  - próximas avaliações;
  - frequência por disciplina, com destaque perto do limite;
  - notas e médias.
- Boletim em PDF gerado no servidor:
  - cabeçalho com escola, aluno, RM, turma e ano;
  - por disciplina: notas, médias, frequência e situação.
  - Pode ser baixado pelo aluno (o próprio) e pela escola (qualquer aluno).

### Pendências fora das etapas
- **Dependabot:**
  - Recomendação: mergear #26, #28, #29, #30, #31, #34, #36 e #37.
  - Fechar #33 (Prisma 7), #35 (TypeScript 7) e #27 (Node 25), porque quebram o CI ou não são LTS.
  - Ainda falta a sua confirmação.
- **PR #40 (develop → main):** a decisão de mergear é sua.
- **Senha do Gmail exposta antes:** precisa ser revogada por você.
- **Design visual** das telas novas (painel do aluno e grade): a spec deixa para uma passada de design depois.
