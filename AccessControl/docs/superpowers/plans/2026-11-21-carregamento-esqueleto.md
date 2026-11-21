# Carregamento com esqueleto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Telas mostram esqueleto (blocos cinza pulsando) enquanto a API não responde, em vez de ficarem vazias.

**Architecture:** Dois componentes em `src/components/Skeleton.tsx` e uma classe CSS; cada tela troca o "vazio durante o carregamento" pelo esqueleto usando o estado que já tem (`loading` nas listas, dado `null` nos cartões).

**Tech Stack:** React, CSS global (`src/styles/global.css`), Jest + Testing Library.

**Spec:** `AccessControl/docs/superpowers/specs/2026-11-21-carregamento-esqueleto-design.md`

## Global Constraints

- Cores só de tokens do tema (`var(--neutral-soft)` e afins); nada de hex novo. Funciona no tema escuro.
- `@media (prefers-reduced-motion: reduce)`: sem animação.
- Container em carregamento: `aria-busy="true"` + texto oculto `Carregando…` (classe de texto oculto já existente no CSS, se houver; senão `.sr-only`). Blocos com `aria-hidden="true"`.
- Nenhuma requisição nova nem mudança de lógica de carregamento.
- Comandos: `cd AccessControl/apps/web && npx jest <arquivo>`; ao fim `npx jest && npx tsc --noEmit && npm run lint && npm run build`. Commits sem `Co-Authored-By`.

## Review Focus

1. Lista que carregou vazia: mostra "nenhum item", nunca esqueleto para sempre. Teste no Task 2.
2. Erro da API: o esqueleto some (a flag `loading` volta a false no `finally`/catch). Teste no Task 2.
3. Tema escuro: o bloco continua visível sobre a superfície escura (token, não cor fixa). Conferir no Task 4.
4. Recarregar uma lista já exibida (ex.: após salvar) não troca os dados por esqueleto (só no primeiro carregamento, quando não há itens). Teste no Task 2.
5. Foto: troca de aluno mostra esqueleto, nunca a foto anterior. Teste no Task 3.

---

### Task 1: Componentes de esqueleto

**Files:** Create `apps/web/src/components/Skeleton.tsx`; Modify `apps/web/src/styles/global.css`; Test `apps/web/tests/Skeleton.test.tsx`

**Interfaces — Produces:**
- `Skeleton({ width?: string; height?: string; className?: string })` → `<span className="skeleton …" aria-hidden="true" style={{ width, height }} />`
- `SkeletonRows({ rows = 5, cols }: { rows?: number; cols: number })` → `rows` × `<tr className="skeleton-row">` com `cols` `<td>` cada um contendo `<Skeleton />`; a primeira linha leva também a `<td>` um texto oculto `Carregando…` (para leitores de tela).

- [ ] Teste: `SkeletonRows rows={3} cols={4}` dentro de `<table><tbody>` gera 3 `tr` e 12 `.skeleton`; existe o texto `Carregando…`; os `.skeleton` têm `aria-hidden`.
- [ ] Rodar → FAIL. Implementar. CSS: `.skeleton` (display inline-block, altura padrão 0.9em, largura 100%, border-radius, `background: var(--neutral-soft)`, animação `skeleton-pulse` de opacidade 1 → 0.45 → 1 em ~1.4s), `@keyframes skeleton-pulse`, e no bloco `prefers-reduced-motion` existente `animation: none`.
- [ ] Rodar → PASS. Commit `feat(web): componentes de esqueleto de carregamento`.

### Task 2: Tabelas

**Files:** Modify `pages/StudentsPage.tsx`, `CoursesPage.tsx`, `ClassGroupsPage.tsx`, `SubjectsPage.tsx`, `TeachersPage.tsx`, `AccessLogsPage.tsx`, `SchoolsPage.tsx`, `UsersPage.tsx`, `ClassGroupPage.tsx` (aba Alunos); Test `apps/web/tests/Loading.test.tsx`

**Interfaces — Consumes:** `SkeletonRows` (Task 1).

- [ ] Testes (com `mockApi` de `tests/harness.tsx`, resposta de `/students` segurada por uma promessa controlada):
  - `/alunos` com API pendente → há `.skeleton-row` e o `tbody` (ou a `table`) tem `aria-busy="true"`; ao liberar com 1 aluno → sem `.skeleton-row`, nome do aluno visível.
  - `/alunos` liberado com `[]` → texto de vazio atual, sem `.skeleton-row`.
  - `/alunos` com 500 → sem `.skeleton-row`.
  - `/cursos` pendente → há `.skeleton-row` (prova de que a troca vale fora de Alunos).
- [ ] Rodar → FAIL. Implementar: em cada página, `{loading && items.length === 0 && <SkeletonRows cols={N} />}` no `tbody`, `N` = número de `<th>` da tabela (contar as colunas visíveis, considerando as condicionais por módulo); `aria-busy={loading}` na `table`. Onde a flag `loading` não volta a false em erro, corrigir no `finally`.
- [ ] `npx jest` PASS. Commit `feat(web): tabelas mostram esqueleto enquanto carregam`.

### Task 3: Cartões e foto

**Files:** Modify `pages/DashboardPage.tsx` (números: `stats === null` → `<Skeleton width="2ch" />` no lugar de `–`), `SettingsPage.tsx`, `ReportCardPage.tsx`, `AttendancePage.tsx`, `AssessmentsPage.tsx`, `CalendarPage.tsx`, `TeacherHomePage.tsx`, `StudentHomePage.tsx`, `components/StudentPhoto.tsx`; Test `tests/Loading.test.tsx`, `tests/StudentPhoto.test.tsx`

**Interfaces — Consumes:** `Skeleton` (Task 1).

- [ ] Testes:
  - Início com `/stats` pendente → 3 `.skeleton` na área dos números e nenhum `–`; liberado → números.
  - `StudentPhoto`: enquanto `studentsApi.photo` pende → `.student-photo` tem um `.skeleton` e nenhum `img`; resolvido → `img` sem `.skeleton`; sem foto (`hasPhoto` false) → ícone, sem `.skeleton`.
- [ ] Rodar → FAIL. Implementar: em cada tela, onde hoje o conteúdo dependente do dado não aparece enquanto ele é `null`, mostrar 2–4 `<Skeleton />` com alturas próximas às do conteúdo final, dentro de um container com `aria-busy="true"`. `StudentPhoto` ganha estado `loading` (true do início da busca até resolver/falhar).
- [ ] `npx jest` PASS. Commit `feat(web): cartões e foto mostram esqueleto enquanto carregam`.

### Task 4: Verificação

- [ ] `npx jest && npx tsc --noEmit && npm run lint && npm run build` verdes.
- [ ] Navegador (Playwright, API real, throttling de rede "Slow 3G" via CDP ou atraso): Alunos, Início, Configurações e foto mostram esqueleto e depois os dados; conferir tema escuro.
- [ ] Commit do que faltar.
