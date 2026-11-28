# Grade: aula inserida já selecionada — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao inserir uma aula/intervalo na grade, o bloco novo fica selecionado e o foco vai para o campo "Início".

**Architecture:** A ação `place` do reducer passa a receber a `key` do bloco (gerada pelo editor com `newKey()`); o editor seleciona essa key e, por um ref de "focar ao inserir", foca o input Início num `useEffect`.

**Tech Stack:** React 19 + TypeScript, Jest + Testing Library (`npm test` em `AccessControl/apps/web`).

**Spec:** `AccessControl/docs/superpowers/specs/2026-11-27-grade-selecionar-aula-inserida-design.md`

## Global Constraints

- Textos de UI em português; comentários só para o porquê, em uma linha.
- Não alterar `src/contexts/ToastContext.tsx` nem `src/styles/global.css` (há mudanças não commitadas de outra tarefa nesses arquivos): faça `git add` só dos arquivos desta tarefa.
- Duração padrão e encaixe de 5 min não mudam.
- **Não commitar** em nenhuma task: o usuário quer um único commit no fim, feito pelo coordenador.

## Review Focus

- Clicar num bloco já existente seleciona sem roubar o foco para o Início (só inserção foca).
- Inserção pelo teclado (Enter na paleta e Enter na coluna) também seleciona e foca o Início.
- Após "Salvar grade" ou "Copiar grade", a seleção continua sendo limpa (comportamento atual de `setSelectedKey(null)`).
- Delete/Backspace digitado dentro do campo Início/Fim (ou qualquer input/select/textarea) NÃO remove o bloco.
- Soltar na paleta um item da própria paleta (não um bloco) não faz nada.

---

### Task 1: Selecionar e focar o bloco recém-inserido

**Files:**
- Modify: `AccessControl/apps/web/src/components/timetable/timetableReducer.ts` (ação `place`, linhas 19 e 45-55)
- Modify: `AccessControl/apps/web/src/components/timetable/TimetableEditor.tsx` (função `place`, linhas 72-76; input Início, linha 217)
- Test: `AccessControl/apps/web/tests/TimetableEditor.test.tsx`, `AccessControl/apps/web/tests/timetableReducer.test.ts`

**Interfaces:**
- Produces: `TimetableAction` `place` vira `{ type: 'place'; key: string; kind; subjectId; weekday; minute }`; o reducer usa `action.key` em vez de chamar `newKey()`.

- [ ] **Step 1: Write the failing test** em `TimetableEditor.test.tsx`:

```tsx
it('a aula inserida já fica selecionada, com o foco no Início', async () => {
  setup();
  await openGrade();

  await userEvent.click(await screen.findByRole('button', { name: /^MAT Matemática/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Colocar em Seg' }));

  expect(screen.getByText('Bloco selecionado')).toBeInTheDocument();
  expect(screen.getByLabelText('Início')).toHaveFocus();
  expect(screen.getByLabelText('Início')).toHaveValue('07:00');
});

it('clicar numa aula existente seleciona sem mover o foco para o Início', async () => {
  setup({ validFrom: '2026-02-01', blocks: [lesson(1, 450, 500)], warnings: [] });
  await openGrade();

  await userEvent.click(await screen.findByRole('button', { name: /^Matemática, Seg/ }));

  expect(screen.getByText('Bloco selecionado')).toBeInTheDocument();
  expect(screen.getByLabelText('Início')).not.toHaveFocus();
});
```

(`07:00` = minuto 420, o mesmo do teste existente de clique na coluna.)

- [ ] **Step 2: Run to verify the first fails**

Run: `npx jest tests/TimetableEditor.test.tsx` (em `AccessControl/apps/web`)
Expected: o primeiro novo teste FALHA (não encontra "Bloco selecionado"); o segundo pode passar.

- [ ] **Step 3: Implement**
  - Reducer: adicionar `key: string` à ação `place` e usar `key: action.key`.
  - Atualizar as 3 chamadas de `place` em `tests/timetableReducer.test.ts` com `key: 'b-teste'` (ou similar).
  - Editor: em `place`, `const key = newKey()` (importar de `./timetableReducer`), despachar com a key, `setSelectedKey(key)`, e marcar `focusStartRef.current = true`.
  - Editor: `startRef` no input Início; `useEffect` dependente de `selectedKey` que, se `focusStartRef.current`, foca `startRef.current` e zera o flag.

- [ ] **Step 4: Run all web tests and typecheck**

Run: `npx tsc --noEmit -p . ; npm test` (em `AccessControl/apps/web`)
Expected: tsc sem erros; todas as suítes passam.

(Sem commit: ver Global Constraints.)

---

### Task 2: Remover bloco com Delete/Backspace ou soltando na paleta

**Files:**
- Modify: `AccessControl/apps/web/src/components/timetable/TimetableGrid.tsx` (exportar `BLOCK_MIME`, linha 10)
- Modify: `AccessControl/apps/web/src/components/timetable/TimetableEditor.tsx` (`<aside className="tt-palette">` e um `useEffect` de teclado; texto de dica da paleta)
- Test: `AccessControl/apps/web/tests/TimetableEditor.test.tsx`

**Interfaces:**
- Consumes: Task 1 (seleção do bloco recém-inserido).
- Produces: `export const BLOCK_MIME = 'application/x-helpus-block'` em `TimetableGrid.tsx` (valor inalterado).

- [ ] **Step 1: Write the failing tests** em `TimetableEditor.test.tsx` (cada um salva e confere o PUT com `blocks: []`, como os testes existentes):

```tsx
it('Delete remove o bloco selecionado', async () => {
  const fetchMock = setup({ validFrom: '2026-02-01', blocks: [lesson(1, 450, 500)], warnings: [] });
  await openGrade();
  await userEvent.click(await screen.findByRole('button', { name: /^Matemática, Seg/ }));
  await userEvent.keyboard('{Delete}');
  expect(screen.queryByRole('button', { name: /^Matemática, Seg/ })).not.toBeInTheDocument();
  expect(screen.queryByText('Bloco selecionado')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Salvar grade' }));
  await waitFor(() => expect(callsTo(fetchMock, '/class-groups/3/timetable', 'PUT')).toHaveLength(1));
  expect(bodyOf(callsTo(fetchMock, '/class-groups/3/timetable', 'PUT')[0]).blocks).toEqual([]);
});

it('Backspace dentro do campo Início não remove o bloco', async () => {
  setup({ validFrom: '2026-02-01', blocks: [lesson(1, 450, 500)], warnings: [] });
  await openGrade();
  await userEvent.click(await screen.findByRole('button', { name: /^Matemática, Seg/ }));
  screen.getByLabelText('Início').focus();
  await userEvent.keyboard('{Backspace}');
  expect(screen.getByRole('button', { name: /^Matemática, Seg/ })).toBeInTheDocument();
});

it('soltar um bloco na coluna de disciplinas remove o bloco', async () => {
  // jsdom não tem DataTransfer: usar um objeto { getData, setData, types } nos fireEvent.dragStart/dragOver/drop.
  // dragStart no botão do bloco (preenche BLOCK_MIME), depois dragOver + drop no <aside> que contém o título "Disciplinas".
  // Esperado: o botão /^Matemática, Seg/ some.
});
```

O terceiro teste: o implementer escreve com um `dataTransfer` falso compartilhado (store em `Map`, `types` = chaves gravadas).

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest tests/TimetableEditor.test.tsx`
Expected: os testes de Delete e de soltar na paleta FALHAM.

- [ ] **Step 3: Implement**
  - `TimetableGrid.tsx`: `export` em `BLOCK_MIME`.
  - Editor, `<aside className="tt-palette">`: `onDragOver` chama `preventDefault()` só se `event.dataTransfer.types.includes(BLOCK_MIME)`; `onDrop` lê `{ key }` de `BLOCK_MIME`, despacha `remove` e limpa a seleção se era o selecionado. Item da paleta solto na paleta: ignorado.
  - Editor: `useEffect` com listener `keydown` em `window` ativo quando há `selectedKey`: se `event.key` é `Delete` ou `Backspace` e o `event.target` não é `input`, `select`, `textarea` nem `contentEditable`, `preventDefault()`, despacha `remove` e `setSelectedKey(null)`.
  - Reaproveitar a mesma rotina de remoção que o botão "Remover" já usa (extrair `removeBlock(key: string)` no editor).
  - Dica da paleta (linha 172) vira: `Arraste para a grade, ou clique aqui e depois no dia. Para remover, arraste a aula de volta para cá ou selecione e aperte Delete.`

- [ ] **Step 4: Run all web tests and typecheck**

Run: `npx tsc --noEmit -p . ; npm test` (em `AccessControl/apps/web`)
Expected: tsc sem erros; todas as suítes passam.

(Sem commit.)

---

### Commit final (coordenador)

Branch `feat/grade-insercao-remocao` a partir de `develop`. Um único commit com: os 4 arquivos de código/teste das tasks, `AccessControl/docs/superpowers/` (spec + plano) e as mudanças já pendentes de `ToastContext.tsx` e `global.css` (avisos na frente da aba e campos de data/hora responsivos), a pedido do usuário. Sem linha Co-Authored-By.
