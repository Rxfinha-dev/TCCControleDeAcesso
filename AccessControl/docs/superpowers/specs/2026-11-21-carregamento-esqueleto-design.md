# Carregamento com esqueleto — Design (curto)

Data: 2026-11-21 · Projeto: HelpUs (`apps/web`)

## Intenção
Enquanto a API não responde, a tela não fica vazia para depois "pular" com os dados: mostra o formato final
com blocos cinza pulsando (esqueleto). Junto, a foto do aluno não mostra mais a foto do aluno anterior
(corrigido em 48e9ef1).

## Abordagens
- **A. Esqueleto (escolhida pelo dono do projeto).** Sem pulo de layout.
- B. Spinner "Carregando…": mais simples, mas o conteúdo pula ao chegar.
- C. Barra de progresso no topo: discreta, não resolve a tela vazia.

## Design
- Componentes em `src/components/Skeleton.tsx`:
  - `<Skeleton width? height? className? />` — barra/bloco solto (cartões, números, títulos).
  - `<SkeletonRows rows={5} cols={N} />` — `<tr>`s de esqueleto dentro do `<tbody>`.
- Reaproveita o estado que as telas já têm: flag `loading` nas listas; dado `null` nas telas de cartão.
  Nenhuma lógica de requisição nova.
- Onde: tabelas de Alunos, Cursos, Turmas, Disciplinas, Professores, Entradas, Escolas, Usuários e aba
  Alunos da turma; cartões do Início (números no lugar do "–"), Configurações, Boletim, Presença,
  Avaliações, Calendário, Início do professor, Painel do aluno; foto do aluno pulsa enquanto carrega.
- Visual: cores dos tokens do tema (claro e escuro); `prefers-reduced-motion: reduce` ⇒ sem pulso.
- Acessibilidade: o container em carregamento tem `aria-busy="true"` e um texto oculto "Carregando…";
  os blocos são `aria-hidden`.

## Não-objetivos
Transição entre rotas; estado de carregamento de botões (já mostram "Salvando…"); busca da Verificação.

## Testes
Tabela de alunos mostra esqueleto com a API pendente e os dados depois; foto mostra esqueleto enquanto
carrega. Testes existentes de estado vazio continuam valendo.
