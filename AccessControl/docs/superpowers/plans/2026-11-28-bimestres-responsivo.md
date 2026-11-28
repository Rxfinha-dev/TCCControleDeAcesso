# Bimestres responsivos no celular — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No celular (iPhone, ~375px), as linhas de bimestre do Calendário (dois campos de data com "a" no meio) não podem vazar do card.

**Architecture:** Só CSS em `AccessControl/apps/web/src/styles/global.css`. Causa: `<fieldset>` tem `min-inline-size: min-content` por padrão do navegador e cresce até a largura mínima dos inputs, ignorando o card.

**Tech Stack:** CSS puro; React/Vite (`AccessControl/apps/web`).

**Spec:** pedido do usuário em 2026-11-28 (print em modo iPhone: os campos de "Fim" saem para fora do card "Bimestres de 2026"). Sem documento de spec à parte.

## Global Constraints

- Não alterar TSX: só `global.css`.
- Desktop (card largo) continua igual: início e fim na mesma linha, com o "a" entre eles.
- Comentários em português, uma linha, só o porquê.
- Não commitar (o coordenador faz um commit único).

## Review Focus

- Em 320–390px de largura, nenhum campo de data passa da borda do card, e o texto `dd/mm/aaaa` + ícone do calendário não fica cortado.
- O outro `<fieldset>` do app (`.concept-list` em `GradingForm.tsx`) não muda de aparência no desktop.

---

### Task 1: Fieldset que encolhe + linha que quebra no celular

**Files:**
- Modify: `AccessControl/apps/web/src/styles/global.css` (regras `.term-row`, ~linha 2537; e uma regra global de `fieldset` perto do estilo base de `input, select`, ~linha 392)

- [ ] **Step 1:** Adicionar regra global `fieldset { min-inline-size: 0; }` (com o comentário do porquê). Isso corrige a causa para todo fieldset.
- [ ] **Step 2:** Para não cortar o texto da data em telas estreitas: dentro da media query de celular já existente no arquivo (procure a que tem `.field-row, .field-row.three { grid-template-columns: 1fr; }`), fazer `.term-row` quebrar em duas linhas: `flex-wrap: wrap;` e os inputs com `flex: 1 1 100%` (um embaixo do outro), escondendo o separador "a" nesse modo (o `<span className="muted">a</span>` é o único `span` direto do `.term-row`: use `.term-row > span { display: none; }` dentro da media query). Os inputs já têm `aria-label` "Início/Fim do Nº bimestre", então nada se perde para leitor de tela.
- [ ] **Step 3: Verify** — em `AccessControl/apps/web`: `npx stylelint` não existe no projeto; rode `npx tsc --noEmit -p .` e `npm test` (devem continuar passando: 29 suítes). Relate o resultado.

(Sem commit. A verificação visual em 375px é feita pelo coordenador no navegador.)
