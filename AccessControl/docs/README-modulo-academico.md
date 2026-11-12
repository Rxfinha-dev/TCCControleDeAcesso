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
- **Frequência por bimestre só na tela da turma** (aba Frequência da Presença). No painel do aluno e no boletim ela aparece no ano. As médias de nota têm bimestre, semestre e ano.
- **Intervalos não aparecem na grade do aluno**, só as aulas.
- **O professor não cadastra disciplinas** (a spec previa). Ele vê a frequência da turma só nas disciplinas dele.
- **"Esqueci minha senha" não funciona para professor e aluno**: a escola gera uma nova senha.

## Limites conhecidos (marcados no código com `shortcut:`)

- A presença é recalculada a cada consulta, sem cache. Os alertas do início calculam o ano de todas as turmas e ficam guardados por 5 minutos na memória da API.
- O fuso de São Paulo é fixo em -03:00.

## Entregue depois das 6 etapas (12/11/2026)

- **Faltas justificadas (atestados):** na Presença, aba "Faltas justificadas". A falta da catraca no período deixa de contar (a aula não entra como dada nem como presença). A correção manual continua valendo sobre o atestado.
- **Alertas no início da escola:** alunos abaixo ou perto do mínimo de frequência e quem não passa na catraca há 7 dias.
- **Frequência por bimestre** na aba Frequência, e a aba liberada para o professor (só as disciplinas dele).
- **Excluir professor ou aluno** apaga também o login no Supabase.
- **Performance:** telas carregadas sob demanda (pacote inicial de 634 kB para 279 kB); boletim, painel e avaliações deixaram de calcular a presença da turma inteira.
- **Segurança:**
  - Gerar nova senha recria o usuário no Supabase, o que encerra as sessões abertas daquele login.
  - `PUT /api/auth/password` vale só para professor e aluno; escola e super admin trocam a senha pelo código por e-mail.

### Ainda em aberto

- **Avisos aos responsáveis** (entrada, saída e falta): falta escolher o canal (e-mail, SMS ou WhatsApp), que tem provedor e custo.
- **Mural dos alunos:** depende das decisões de moderação e alcance.
- **`npm audit`:** 3 alertas altos em `deepmerge-ts`, dependência da CLI do Prisma (roda no build e nas migrations, não nas requisições). A correção exige o Prisma 7.
- Quando o próprio professor ou aluno troca a senha, as outras sessões dele continuam abertas até expirar.

## Pendências fora do módulo

- **Dependabot:** recomendação de mergear #26, #28, #29, #30, #31, #34, #36 e #37, e fechar #33 (Prisma 7), #35 (TypeScript 7) e #27 (Node 25). Falta a sua confirmação.
- **Senha do Gmail exposta antes:** precisa ser revogada por você.
- **Design visual** das telas novas: a spec deixa para uma passada de design depois. As telas usam os componentes e tokens que já existiam, mas não foram revisadas no navegador.
