# Módulo acadêmico: turmas, grade, presença, avaliações e acesso de professores e alunos

Data: 2026-11-08 · Status: rascunho para aprovação

## Intenção

Hoje o HelpUs registra **entradas** de alunos na catraca (digital ou entrada manual). Este módulo transforma essas leituras em **presença por aula**: a escola monta a grade semanal de cada turma, a catraca diz quando o aluno estava dentro da escola, e o sistema marca presença ou falta em cada aula automaticamente. Em volta disso entram as peças que fazem a presença ser útil no dia a dia escolar: disciplinas, professores, calendário com feriados, avaliações com notas e médias, e o acesso do próprio aluno à sua grade, frequência, notas e boletim.

O motivo: a chamada manual é trabalhosa e imprecisa, e a catraca já tem o dado. O sucesso é o aluno abrir o sistema e ver, por disciplina, quantas faltas tem e qual a média, sem que ninguém tenha feito chamada à mão — e o professor só precisar corrigir exceções.

## Contexto do sistema atual (o que já existe)

- Monorepo `AccessControl/`: `apps/api` (Express 5, Prisma 6, Postgres no Supabase, Zod, Jest) e `apps/web` (React 19, react-router 7, Jest + Testing Library). Auth pelo Supabase Auth. Deploy no Render; merge em `main` roda `prisma migrate deploy`.
- Modelos: `School`, `Course` (curso técnico/habilitação), `Student` (rm, `year` FIRST/SECOND/THIRD, `courseId` obrigatório, `fingerprintId`), `AccessLog` (studentId, method FINGERPRINT/MANUAL, createdAt), `User` (role SUPER_ADMIN/SCHOOL/STUDENT/EMPLOYEE/TEACHER, `authUserId`, `schoolId`).
- Escopo por escola: cabeçalho `X-School-Id` + middleware `requireSchoolScope`; o login de escola só enxerga a própria escola; o super admin escolhe a escola no seletor. Ver `docs/superpowers/specs/2026-11-07-permissoes-usuarios-design.md`.
- Há **uma catraca por escola**, usada para entrada e saída.

## Objetivos

1. A escola cadastra turmas, disciplinas e quem leciona o quê, e monta a grade semanal de cada turma arrastando disciplinas numa agenda.
2. O sistema calcula presença/falta por aula a partir das leituras da catraca, respeitando feriados e dias sem aula.
3. Escola e professor corrigem presença manualmente.
4. Professor marca avaliações (provas/trabalhos) e lança notas; o sistema calcula médias no sistema de notas da escola.
5. Escola cria logins de professores e alunos; eles trocam a senha no primeiro acesso.
6. Aluno vê painel com grade, próximas avaliações, frequência, notas/médias e baixa o boletim em PDF.

## Não-objetivos (desta fase)

- Feriados estaduais e municipais automáticos (só nacionais; os locais a escola adiciona).
- Dia sem aula para uma turma só (excursão etc.) — dia sem aula vale para a escola inteira.
- Recuperação, conselho de classe, boletim oficial assinado/carimbado.
- Notificações por e-mail ou push (prova marcada, nota lançada, aviso de faltas).
- Edição da grade pelo celular (no celular a grade é só leitura).
- Integração com secretarias de educação ou sistemas externos de gestão escolar.
- Perfil EMPLOYEE (funcionário) continua "em breve".

## Anti-objetivos (o que tornaria isso um fracasso mesmo funcionando)

- Dar falta para a escola inteira num feriado, ou para um aluno que estava presente porque a leitura de saída faltou.
- Correção manual de professor/escola ser apagada por um recálculo automático.
- Aluno ver nota, presença ou dados de outro aluno; professor ver turma em que não leciona.
- Grade que fica bagunçada sem a escola perceber (aulas sobrepostas na mesma turma).
- Quebrar o fluxo atual de entradas, verificação e cadastro de alunos.

## Restrições

- Fuso horário de todos os cálculos de dia e horário: `America/Sao_Paulo`.
- Seguir os padrões existentes: módulos em `apps/api/src/modules/<nome>`, Zod para validação, escopo via `requireSchoolScope`/`currentSchool`, códigos de erro em maiúsculas, testes Jest com Prisma mockado, OpenAPI atualizado.
- Toda alteração de schema com migration; RLS habilitado em tabelas novas (como em `users`).
- Não rodar prettier (o repositório não tem config; reformata arquivos).
- Commits sem a linha `Co-Authored-By: Claude`.

---

## 1. Turmas, disciplinas e atribuições

### Turma
- Campos: **nome livre** ("2º DS A", "9º ano B", "1ª série C"), **ano letivo** (ex.: 2026), **turno** (manhã, tarde, noite, integral), **curso opcional** (escola técnica liga a um `Course`; escola regular deixa vazio).
- Pode haver várias turmas do mesmo curso/ano.
- **Copiar turmas do ano anterior**: cria as turmas do novo ano letivo a partir das do anterior (nome, turno, curso, atribuições e grade), sem alunos. *Minha call:* copiar também atribuições e grade; a escola ajusta.

### Aluno na turma
- Um aluno pertence a **uma turma por ano letivo**.
- Alunos já cadastrados ficam **sem turma** até a escola colocá-los numa; sem turma não têm grade nem presença por aula, só o registro de entrada de hoje.
- Troca de turma no meio do ano: presenças e notas anteriores continuam ligadas à turma antiga; a partir da data da troca vale a grade da nova.
- *Minha call:* `Student.courseId` e `Student.year` passam a ser **opcionais** (escola de ensino regular não tem curso técnico nem "1º/2º/3º ano" fixo). A série/curso exibidos vêm da turma quando houver. O cadastro atual de alunos continua funcionando para quem já usa.

### Disciplinas
- Lista única por escola: **nome**, **sigla curta** para a grade ("Mat."), **cor**.
- Cadastradas pela escola e também por professores (entram na mesma lista da escola).

### Atribuição (quem leciona o quê)
- Por turma: disciplina → professor ("2º DS A: Matemática — Profª Ana").
- Na paleta da grade, a disciplina de uma turma só aparece depois de atribuída a um professor. *Minha call.*
- A atribuição é o que dá ao professor acesso à turma: ver alunos, fazer chamada das suas aulas, lançar avaliações e notas.

## 2. Grade semanal (agenda livre de arrastar)

- Decisão do usuário: **agenda livre estilo calendário** (opção B do mockup), não quadro de horários fixos. Cada escola organiza o dia como quiser.
- Visualização semanal (seg–sex; *minha call:* sábado aparece se a escola tiver aula no sábado em alguma turma, ou por configuração) por turma.
- A escola arrasta uma disciplina da paleta para um dia/horário e **estica o bloco** para ajustar início e fim. Encaixe de **5 em 5 minutos**.
- Cada bloco: disciplina (e por consequência o professor atribuído), dia da semana, hora de início, hora de fim.
- **Intervalo** também é um bloco arrastável; não conta presença, serve para o aluno ver. Horário vazio = sem aula.
- Validações: na mesma turma, blocos **não podem se sobrepor** (bloqueia). Mesmo professor em duas turmas no mesmo horário: **avisa, mas deixa salvar**.
- Copiar a grade de outra turma como ponto de partida.
- Edição só em telas largas; no celular a grade é somente leitura.
- **Mudança de grade no meio do ano vale a partir do dia em que foi salva**; presenças de dias anteriores não mudam. Isso implica que a grade tem vigência (data de início) — o builder decide a modelagem (versões da grade ou vigência por bloco).

## 3. Calendário: feriados, dias sem aula e períodos letivos

- **Feriados nacionais automáticos** pela BrasilAPI (`https://brasilapi.com.br/api/feriados/v1/{ano}`), inclusive os móveis. Buscados uma vez por ano e sob demanda quando a escola abre um ano ainda não carregado. Decisão do usuário: só os nacionais.
- A escola pode **desmarcar** um feriado (ex.: reposição) e **adicionar** dias sem aula com nome, data única ou intervalo ("Recesso de julho").
- Dia sem aula = como fim de semana: não existe aula, ninguém tem presença nem falta, não entra na % de frequência. Vale para a escola inteira.
- **Períodos letivos**: a escola define os **bimestres** do ano letivo com datas de início/fim. Os semestres são derivados (1º semestre = 1º + 2º bimestre; 2º semestre = 3º + 4º). Dias fora de qualquer bimestre não contam presença. *Minha call:* nesta fase os períodos são sempre bimestres (o usuário pediu médias bimestral, semestral e anual); escolas por trimestre ficam para depois.
- Falha da BrasilAPI não pode quebrar nada: o calendário funciona sem os feriados e tenta de novo depois. *Minha call.*

## 4. Presença automática

### Regra (decidida pelo usuário)
- As leituras da catraca do aluno no dia **alternam entrada/saída**: 1ª = entrada, 2ª = saída, 3ª = entrada… Isso forma os intervalos em que ele esteve dentro da escola.
- **Leitura repetida**: uma leitura feita até **1 minuto** depois da leitura anterior do mesmo aluno é ignorada (dedo passado duas vezes, clique duplo na entrada manual). Decisão do usuário: 1 minuto. O filtro é aplicado **no cálculo**, não na gravação — o registro de entradas continua igual e entradas antigas também se beneficiam. Uma leitura perdida no meio do dia é resolvida por correção manual.
- Em cada aula da grade da turma dele naquele dia, o aluno tem **presença se ficou dentro por pelo menos metade da duração da aula**; senão, falta.
- Sair no intervalo não afeta nada se voltar antes da próxima aula (consequência natural da regra).
- **Sem leitura de saída**: considera que ficou até o fim do dia.
- **Não entrou no dia**: falta em todas as aulas do dia.
- Entrada manual (método MANUAL na Verificação) conta como leitura normal.
- Blocos de intervalo não geram presença.

### Correção manual
- A escola corrige qualquer aula; o professor só as aulas das disciplinas atribuídas a ele.
- Correção manual **nunca** é sobrescrita pelo cálculo automático; registra quem corrigiu e quando.

### Falta do professor e aula cancelada
- Decisão do usuário: se o professor faltou ou a aula foi cancelada, a **presença é coletiva** — todos os alunos da turma recebem presença naquela aula, independentemente da catraca.
- A marcação é por aula (turma + bloco + data), com o motivo "Falta do professor" ou "Aula cancelada". *Minha call:* a escola marca qualquer aula; o professor marca as suas. Registra quem marcou.
- Uma correção manual individual feita depois para um aluno nessa aula continua valendo sobre a presença coletiva. *Minha call.*

### Quando calcula
- O professor deve ver a chamada da aula logo depois que ela termina, e leituras atrasadas no fim do dia precisam ser consideradas.
- *Minha call (orientação ao builder):* a presença automática é **derivada** — calculada a partir de leituras + grade vigente + calendário — e só as **correções manuais são persistidas**. Isso evita depender de um agendador (o serviço no Render pode dormir) e garante que leituras atrasadas entram sem job. Se o builder precisar persistir/cachear para desempenho (relatórios, boletim), o resultado deve ser idêntico ao derivado e correções manuais continuam prevalecendo.
- Aula ainda não terminada aparece como "em andamento", não como falta.

### Frequência
- % de presença por disciplina no período = aulas com presença ÷ aulas dadas (dias sem aula fora da conta).
- Frequência mínima padrão **75%** (LDB), configurável por escola. O painel avisa quando o aluno está perto do limite. *Minha call:* "perto" = a menos de 5 pontos percentuais do mínimo, ou já abaixo.

## 5. Avaliações, notas e médias

### Avaliação
- Criada pelo **professor** nas turmas/disciplinas atribuídas a ele; a escola também cria, edita e exclui qualquer uma.
- Tipo: **prova** ou **trabalho**. Campos: turma, disciplina, data, aula (bloco daquela disciplina naquele dia — se não houver aula da disciplina no dia, não deixa salvar), título, conteúdo (texto livre), observação opcional (local, material), **peso** (padrão 1).
- *Minha call:* trabalho pode ter data sem estar preso a um bloco (entrega), já que trabalho não necessariamente acontece em aula; prova exige bloco.
- Na grade semanal a aula com prova ganha selo "Prova" e cor de destaque; clicar mostra título e conteúdo. Mudança de data reflete na hora para o aluno.

### Sistema de notas (por escola)
- **Numérico**: nota máxima (10 ou 100), casas decimais, nota mínima para aprovação.
- **Conceitos**: lista ordenada definida pela escola (ex.: MB, B, R, I), quais aprovam, e o valor interno de cada um para cálculo (*minha call:* padrão MB=4, B=3, R=2, I=1, editável).
- Depois que a primeira nota é lançada, o sistema de notas não pode mais ser trocado. *Minha call.*

### Notas e médias
- O professor lança a nota de cada aluno da turma numa lista; o aluno vê assim que salva.
- Aluno sem nota numa avaliação: fica "sem nota" e *(minha call)* não entra na média até ser lançada.
- Média por disciplina em três níveis (decisão do usuário):
  - **Bimestral**: média ponderada pelos pesos das avaliações do bimestre (conceitos: média ponderada dos valores, convertida para o conceito de valor mais próximo).
  - **Semestral**: média simples dos dois bimestres do semestre.
  - **Anual**: média simples dos bimestres do ano.
  - *Minha call:* bimestre sem nenhuma nota lançada fica fora das médias semestral e anual até ter nota; as médias semestral/anual são calculadas com os valores numéricos (sem arredondar para conceito antes) e só a exibição final é convertida.
- Situação: acima/abaixo do mínimo de aprovação em cada nível; a situação anual é a que vale para aprovação.
- Frequência também mostrada por bimestre, semestre e ano.

### Troca de turma no meio do período (minha call)
- Se a disciplina é a mesma nas duas turmas, frequência e notas do período se **juntam numa linha só** por disciplina no painel e no boletim (chave: aluno + disciplina + período).
- O professor da turma antiga continua vendo apenas os registros das aulas dele, de antes da troca.

## 6. Logins de professores e alunos

- A **escola cria** os logins. Decisões do usuário:
  - Usuário gerado pela escola no formato `nome.sobrenome@<código-da-escola>` para professor (ex.: `joao.silva@etec-jau`); para aluno, *minha call*, a partir do RM (`24001@etec-jau`).
  - A escola define a senha inicial; **troca obrigatória no primeiro acesso**.
  - Esqueceu a senha: a escola gera uma nova (*minha call*), que de novo exige troca.
  - Professor que dá aula em duas escolas tem **um login em cada escola**.
  - E-mail de contato guardado à parte, pode se repetir entre logins (o mesmo professor em duas escolas).
- Isso exige que cada escola tenha um **código curto único** (ex.: `etec-jau`), definido no cadastro da escola e editável pelo super admin. *Minha call.*
- *Minha call:* cada login recebe um **e-mail sintético interno** único no Supabase Auth (derivado do usuário), já que o Supabase exige e-mail único; a tela de login aceita o usuário (`joao.silva@etec-jau`) e o traduz. O builder decide o formato exato do e-mail sintético.
- **Gerar logins da turma** (decisão do usuário): um botão cria de uma vez os logins de todos os alunos da turma que ainda não têm, com senhas iniciais automáticas, e gera uma lista para imprimir e entregar (aluno, usuário, senha inicial). As senhas só aparecem nessa lista, no momento da geração. Falha em parte dos alunos não pode deixar login pela metade: o resultado diz quem foi criado e quem falhou, e gerar de novo cria só os que faltam. *Minha call* para o tratamento de falhas.
- O login de escola e o de super admin continuam como hoje (e-mail real).
- Perfis novos ativados: `TEACHER` e `STUDENT`. O aluno com login fica ligado ao seu registro `Student`.

## 7. Telas

### Escola (login atual) — novos itens no menu
- **Turmas**: criar, copiar do ano anterior, colocar alunos, atribuir professores por disciplina.
- **Grade**: agenda de arrastar por turma.
- **Disciplinas**.
- **Calendário**: feriados automáticos + dias sem aula + períodos letivos.
- **Professores** e **logins de alunos**: gerar usuário e senha inicial, gerar nova senha.
- **Presença**: chamada de qualquer aula com correção manual; frequência por turma/aluno.
- **Avaliações e notas**.
- **Configurações**: sistema de notas, frequência mínima.
- Boletim em PDF de qualquer aluno.

### Professor
- **Início**: aulas de hoje e próximas avaliações.
- **Minhas turmas**.
- **Chamada da aula**: lista calculada pela catraca, com correção presença/falta.
- **Avaliações**: marcar e lançar notas em lista.
- Cadastrar disciplinas.

### Aluno — painel
- Grade da semana com selo nas aulas com prova.
- Próximas avaliações.
- Frequência por disciplina, com destaque perto do limite.
- Notas por avaliação e média por disciplina no período.
- Botão **Baixar boletim**.

### Super admin
- Vê e age em tudo isso em qualquer escola pelo seletor de escola existente.

### Primeiro acesso
- Professor e aluno caem numa tela de troca de senha obrigatória antes de qualquer outra.

### Visual
- O design visual das telas (especialmente o painel do aluno e a grade) será feito depois com a skill de frontend-design, seguindo os tokens existentes em `apps/web/src/styles/global.css` (fontes Sora/Instrument Sans, paleta sky). Não faz parte da aprovação deste documento além do layout da grade (agenda livre).

## 8. Boletim em PDF

- Gerado pelo próprio aluno (o dele) e pela escola (qualquer aluno).
- Conteúdo: cabeçalho com escola, aluno, RM, turma e ano letivo; por disciplina: notas de cada avaliação, médias bimestrais, semestrais e anual, frequência (% e número de faltas) e situação em relação ao mínimo de aprovação. *Minha call:* um boletim cobre o ano letivo inteiro até a data de emissão.
- Documento de acompanhamento, **não oficial**: sem assinatura nem carimbo.
- O builder escolhe gerar no servidor ou no navegador. *Minha call de preferência:* no servidor, para que o conteúdo venha das mesmas regras de cálculo e não dependa de dados vistos no cliente.

## 9. Permissões (resumo)

| Ação | Super admin | Escola | Professor | Aluno |
|---|---|---|---|---|
| Turmas, grade, disciplinas, calendário, configurações | todas as escolas | própria escola | cadastrar disciplinas | — |
| Logins de professor/aluno | ✔ | ✔ | — | — |
| Ver/corrigir presença | ✔ | ✔ | só aulas atribuídas a ele | ver a própria |
| Avaliações e notas | ✔ | ✔ | turmas/disciplinas atribuídas | ver as próprias |
| Boletim PDF | ✔ | qualquer aluno | — | o próprio |

## 10. Ordem de entrega

Um plano de implementação por etapa, nesta ordem (cada uma entrega algo usável):

1. Turmas, disciplinas, atribuição de professores (sem login ainda: professor como cadastro) e grade de arrastar.
2. Calendário: feriados nacionais automáticos, dias sem aula, períodos letivos.
3. Presença automática e correção manual pela escola.
4. Logins de professor e aluno com troca de senha no primeiro acesso; telas do professor (chamada e correção).
5. Avaliações, sistema de notas e médias.
6. Painel do aluno e boletim em PDF.

## O que fica a cargo do builder

- Modelagem exata das tabelas (nomes, vigência da grade, como guardar correções e notas).
- Biblioteca de arrastar-e-soltar e de geração de PDF.
- Cache/persistência da presença derivada, se necessário, respeitando a seção 4.
- Formato do e-mail sintético e do código da escola.
- Detalhes visuais das telas (fase de design posterior).
