# Módulo acadêmico: andamento

A especificação completa está em [`superpowers/specs/2026-11-08-modulo-academico-design.md`](superpowers/specs/2026-11-08-modulo-academico-design.md), que divide o módulo em 6 etapas (seção 10). Cada etapa é uma branch e um PR.

*Atualizado em 11/11/2026.*

## Resumo

O código das 6 etapas está pronto. Falta revisar e mergear os PRs, e testar os logins contra o Supabase real.

| Etapa | O que entrega | PR | Situação |
|---|---|---|---|
| 1 | Turmas, disciplinas, professores e grade de arrastar | #39 | ✅ Mergeada |
| 2 | Calendário: feriados automáticos, dias sem aula, bimestres | #41 | 🟡 Aberto |
| 3 | Presença automática pela catraca e correção manual | #42 | 🟡 Aberto |
| 4 | Logins de professor e aluno, troca de senha, telas do professor | #43 | 🟡 Aberto |
| 5 | Avaliações, sistema de notas e médias | #44 | 🟡 Aberto |
| 6 | Painel do aluno e boletim | #45 | 🟡 Aberto |

## Ordem de merge

Os PRs estão **empilhados**: cada um tem como base a branch do anterior, para o diff mostrar só a etapa dele.

1. Mergeie na ordem: **#41 → #42 → #43 → #44 → #45**.
2. Ao mergear, apague a branch. O GitHub então muda a base do PR seguinte para `develop` sozinho.
3. Depois, o **PR #40** (develop → main) leva tudo para produção. O merge em `main` dispara o deploy, que roda as 4 migrations novas (`school_calendar`, `attendance`, `logins`, `assessments`; a etapa 6 não tem migration).

## O que precisa ser configurado e testado no deploy

- **`SUPABASE_SERVICE_ROLE_KEY` na API.** Sem ela, criar logins de professor e aluno responde `LOGINS_UNAVAILABLE`. O resto do sistema funciona.
- **Ainda não testado contra o Supabase real** (os testes usam um Supabase simulado):
  - Se o Supabase aceita os e-mails sintéticos `usuario@codigo.helpus.invalid`. Se recusar, troque o sufixo em `apps/api/src/lib/logins.ts` e em `apps/web/src/api/auth.ts` (os dois precisam ser iguais).
  - Se a política de senha do projeto aceita senhas de 8 caracteres (as geradas pelo sistema têm 8, com letras e números).
- **Primeiro uso por escola:**
  1. Em Configurações, definir o **código da escola** (ex.: `etec-jau`) e o **sistema de notas**. O código trava depois do primeiro login criado; o sistema de notas trava depois da primeira nota.
  2. No Calendário, definir os **4 bimestres**. Sem eles não há presença nem avaliação.
  3. Montar turmas, atribuir professores e a grade.
  4. Criar os logins: em Professores (um a um) e na aba Alunos de cada turma ("Gerar logins da turma").

## O que cada perfil vê

| Perfil | Telas |
|---|---|
| Escola / super admin | Tudo de antes, mais Calendário, Presença, Avaliações, logins e o boletim de qualquer aluno (botão "Boletim" na aba Alunos da turma) |
| Professor | Início (aulas de hoje), Chamada e Avaliações, só das disciplinas atribuídas a ele |
| Aluno | Início (grade da semana com provas, próximas avaliações, frequência e notas) e Boletim |

Professor e aluno trocam a senha inicial no primeiro acesso.

## Decisões que diferem da spec ou que ela deixava em aberto

- **Boletim em PDF pelo navegador.** O botão "Baixar boletim" abre a impressão do navegador (Salvar como PDF). Os dados vêm calculados da API, pelas mesmas regras das telas. A spec permitia servidor ou navegador; assim não entrou biblioteca de PDF.
- **Código da escola nas Configurações**, e não no cadastro de escolas do super admin. O super admin chega lá pelo seletor de escola.
- **Frequência por bimestre e semestre não entrou.** A frequência aparece no ano (do início do ano letivo até hoje), por disciplina e no total. As médias de nota têm bimestre, semestre e ano.
- **Intervalos não aparecem na grade do aluno**, só as aulas.
- **O professor não vê a aba Frequência da turma** nem cadastra disciplinas (a spec previa o cadastro de disciplinas pelo professor).
- **"Esqueci minha senha" não funciona para professor e aluno**: a escola gera uma nova senha.
- **Excluir professor ou aluno** apaga o login no banco, mas o usuário fica no Supabase Auth. Ele não consegue entrar (a API recusa com `LOGIN_DISABLED`).

## Limites conhecidos (marcados no código com `shortcut:`)

- A presença é recalculada a cada consulta, sem cache. O boletim calcula a turma inteira do aluno no ano; em turmas grandes no fim do ano pode levar alguns segundos.
- O fuso de São Paulo é fixo em -03:00.

## Pendências fora do módulo

- **Dependabot:** recomendação de mergear #26, #28, #29, #30, #31, #34, #36 e #37, e fechar #33 (Prisma 7), #35 (TypeScript 7) e #27 (Node 25). Falta a sua confirmação.
- **Senha do Gmail exposta antes:** precisa ser revogada por você.
- **Design visual** das telas novas: a spec deixa para uma passada de design depois. As telas usam os componentes e tokens que já existiam, mas não foram revisadas no navegador.
