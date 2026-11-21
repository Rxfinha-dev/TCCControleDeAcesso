import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALL_MODULES, jsonResponse, mockApi, renderAt, type Route } from './harness';
import { todayIso } from '../src/utils/academic';
import { setMockSession } from './mocks/supabase';

/** Esqueleto de carregamento das tabelas: a resposta da API é segurada por uma promessa até o teste liberá-la. */

const aluno = { id: 1, name: 'Ana Souza', rm: '123', grade: '1', courseId: 1, course: { id: 1, name: 'Info' }, fingerprintId: null };

/** Mock em que `path` fica pendente até `release` ser chamada; o resto responde por `others`. */
function holdApi(path: string, route?: Route, me?: unknown) {
  let release: (res: Response) => void = () => {};
  const held = new Promise<Response>((resolve) => (release = resolve));
  const fetchMock = mockApi(route, me);
  const base = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) =>
    String(url).replace(/^.*\/api/, '').split('?')[0] === path ? held : base(url, init));
  return release;
}

const rows = () => document.querySelectorAll('.skeleton-row');

describe('esqueleto nas tabelas', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('alunos: mostra esqueleto enquanto pendente e troca pelos dados', async () => {
    const release = holdApi('/students');
    renderAt('/alunos');
    await waitFor(() => expect(rows().length).toBeGreaterThan(0));
    expect(document.querySelector('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText(/\d+ alunos?$/)).not.toBeInTheDocument();
    await act(async () => release(jsonResponse(200, [aluno])));
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
    expect(screen.getByText('1 aluno')).toBeInTheDocument();
  });

  it('alunos: lista vazia mostra o texto de vazio, sem esqueleto', async () => {
    mockApi((path) => (path.startsWith('/students') ? jsonResponse(200, []) : undefined));
    renderAt('/alunos');
    expect(await screen.findByText(/nenhum aluno/i)).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
  });

  it('alunos: erro 500 não deixa esqueleto', async () => {
    mockApi((path) => (path.startsWith('/students') ? jsonResponse(500, { message: 'falhou' }) : undefined));
    renderAt('/alunos');
    await waitFor(() => expect(document.querySelector('table')).toHaveAttribute('aria-busy', 'false'));
    expect(rows()).toHaveLength(0);
  });

  it('alunos: recarga com dados na tela mantém os dados, sem esqueleto', async () => {
    mockApi((path) => (path.startsWith('/students') ? jsonResponse(200, [aluno]) : undefined));
    renderAt('/alunos');
    await screen.findByText('Ana Souza');
    await userEvent.type(screen.getByRole('searchbox'), 'a');
    expect(rows()).toHaveLength(0);
    expect(screen.getByText('Ana Souza')).toBeInTheDocument();
  });

  it('cursos: mostra esqueleto enquanto pendente', async () => {
    holdApi('/courses');
    renderAt('/cursos');
    await waitFor(() => expect(rows().length).toBeGreaterThan(0));
  });
});

describe('esqueleto nos cartões', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  const skeletons = () => document.querySelectorAll('.skeleton');
  const stats = { students: 42, entriesToday: 7, pendingFingerprints: 3, recentEntries: [] };

  it('início: números em esqueleto enquanto /stats pende, depois os valores', async () => {
    const release = holdApi('/stats');
    renderAt('/');
    await waitFor(() => expect(skeletons()).toHaveLength(3));
    expect(screen.queryByText('–')).not.toBeInTheDocument();
    await act(async () => release(jsonResponse(200, stats)));
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(skeletons()).toHaveLength(0);
  });

  it('início: erro em /stats não deixa esqueleto para sempre', async () => {
    mockApi((path) => (path.startsWith('/stats') ? jsonResponse(500, { message: 'falhou' }) : undefined));
    renderAt('/');
    expect((await screen.findAllByText('–')).length).toBe(3);
    expect(skeletons()).toHaveLength(0);
  });

  it('configurações: esqueleto no cartão de notas enquanto /settings pende, depois o formulário', async () => {
    const release = holdApi('/settings');
    renderAt('/configuracoes');
    await waitFor(() => expect(skeletons().length).toBeGreaterThan(0));
    expect(screen.queryByText('Sistema de notas')).not.toBeInTheDocument();
    const grading = { kind: 'NUMERIC', max: 10, decimals: 1, passing: 6, concepts: [] };
    await act(async () => release(jsonResponse(200, { minAttendance: 75, code: 'etec-jau', grading })));
    expect(await screen.findByText('Sistema de notas')).toBeInTheDocument();
    expect(skeletons()).toHaveLength(0);
  });
});

describe('leitor de tela: um único "Carregando…" por área', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));
  const announcements = () => screen.queryAllByText('Carregando…');

  it('início pendente: um só aviso, fora do link de pendências', async () => {
    holdApi('/stats');
    renderAt('/');
    await waitFor(() => expect(announcements()).toHaveLength(1));
    expect(screen.getByRole('link', { name: /alunos sem digital cadastrada/ })).not.toHaveAccessibleName(/Carregando/);
  });

  it('calendário pendente: um só aviso para as duas tabelas', async () => {
    holdApi('/calendar');
    renderAt('/calendario');
    await waitFor(() => expect(document.querySelectorAll('.skeleton-row').length).toBeGreaterThan(0));
    expect(announcements()).toHaveLength(1);
  });

  it('calendário carregado: tabelas sem aria-busy', async () => {
    mockApi((path) => (path.startsWith('/calendar?') ? jsonResponse(200, { year: 2026, holidaysLoaded: true, holidays: [], noClassDays: [], terms: [] }) : undefined));
    renderAt('/calendario');
    await waitFor(() => expect(document.querySelectorAll('table').length).toBeGreaterThan(0));
    await waitFor(() => expect(document.querySelector('.skeleton-row')).toBeNull());
    document.querySelectorAll('table').forEach((table) => expect(table).not.toHaveAttribute('aria-busy'));
  });
});

describe('esqueleto enquanto a lista de turmas carrega', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));
  const skeletons = () => document.querySelectorAll('.skeleton');
  const telas = [
    ['presença', '/presenca'],
    ['avaliações', '/avaliacoes'],
  ];

  it.each(telas)('%s: turmas pendentes mostram esqueleto', async (_nome, url) => {
    holdApi('/class-groups');
    renderAt(url);
    await waitFor(() => expect(skeletons().length).toBeGreaterThan(0));
  });

  it.each(telas)('%s: turmas liberadas vazias não deixam esqueleto', async (_nome, url) => {
    const release = holdApi('/class-groups');
    renderAt(url);
    await waitFor(() => expect(skeletons().length).toBeGreaterThan(0));
    await act(async () => release(jsonResponse(200, [])));
    expect(await screen.findByText(/nenhuma turma neste ano letivo/i)).toBeInTheDocument();
    expect(skeletons()).toHaveLength(0);
  });

  it.each(telas)('%s: erro 500 nas turmas não deixa esqueleto', async (_nome, url) => {
    mockApi((path) => (path.startsWith('/class-groups') ? jsonResponse(500, { message: 'falhou' }) : undefined));
    renderAt(url);
    await screen.findByText('falhou');
    expect(skeletons()).toHaveLength(0);
  });
});

describe('esqueleto das telas de cartão', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));
  const skeletons = () => document.querySelectorAll('.skeleton');
  const withUser = (role: string) => ({
    id: 9, name: 'Ana Prado', email: 'a@b.c', role, mustChangePassword: false,
    school: { id: 1, name: 'ETEC Jaú', plan: 'ASSESSMENTS', modules: ALL_MODULES },
  });
  const GROUPS = [{ id: 20, name: '2º DS A', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 2 }];
  const classGroups: Route = (path) => (path.startsWith('/class-groups?') ? jsonResponse(200, GROUPS) : undefined);
  const grading = { kind: 'NUMERIC', max: 10, decimals: 1, passing: 6, concepts: [] };
  const card = {
    school: { name: 'ETEC Jaú' }, student: { id: 10, name: 'Ana Souza', rm: '24010' }, classGroup: { id: 20, name: '2º DS A' },
    schoolYear: 2026, issuedOn: '2026-03-11', minAttendance: 75, grading,
    attendance: { given: 30, present: 24, percent: 80, status: 'OK' }, subjects: [],
  };

  const cases: { nome: string; url: string; path: string; body: unknown; me?: unknown; route?: Route; conteudo: RegExp | string }[] = [
    { nome: 'boletim', url: '/boletim/10', path: '/report-cards/10', body: card, conteudo: 'Ana Souza' },
    {
      nome: 'início do professor', url: '/', path: '/attendance/my-lessons', me: withUser('TEACHER'),
      body: { date: todayIso(), day: { kind: 'SCHOOL_DAY' }, classGroups: [], lessons: [] }, conteudo: /não leciona em nenhuma turma/,
    },
    {
      nome: 'início do aluno', url: '/', path: '/student/panel', me: withUser('STUDENT'),
      body: { reportCard: card, week: [], upcoming: [] }, conteudo: /Olá, Ana/,
    },
    {
      nome: 'presença (dia)', url: '/presenca', path: '/attendance/day', route: classGroups,
      body: { date: todayIso(), day: { kind: 'SCHOOL_DAY' }, lessons: [], students: [] }, conteudo: /não tem aula neste dia/,
    },
    {
      nome: 'avaliações (lista)', url: '/avaliacoes', path: '/assessments', route: classGroups,
      body: { grading, subjects: [], assessments: [] }, conteudo: /ainda não tem disciplina/,
    },
    {
      nome: 'calendário', url: '/calendario', path: '/calendar',
      body: { year: 2026, holidaysLoaded: true, holidays: [], noClassDays: [], terms: [] }, conteudo: /Nenhum/i,
    },
    { nome: 'configurações', url: '/configuracoes', path: '/settings', body: { minAttendance: 75, code: 'etec-jau', grading }, conteudo: 'Sistema de notas' },
  ];

  it.each(cases)('$nome: pendente mostra esqueleto; liberada mostra o conteúdo sem esqueleto', async ({ url, path, body, me, route, conteudo }) => {
    const release = holdApi(path, route, me);
    renderAt(url);
    await waitFor(() => expect(skeletons().length).toBeGreaterThan(0));
    await act(async () => release(jsonResponse(200, body)));
    expect((await screen.findAllByText(conteudo)).length).toBeGreaterThan(0);
    expect(skeletons()).toHaveLength(0);
  });

  it.each(cases)('$nome: erro 500 não deixa esqueleto', async ({ url, path, me, route }) => {
    mockApi((p, m, b) => (p.split('?')[0] === path ? jsonResponse(500, { message: 'falhou' }) : route?.(p, m, b)), me);
    renderAt(url);
    await screen.findByText('falhou');
    expect(skeletons()).toHaveLength(0);
  });

  it('configurações: carregou com grading null, sem esqueleto', async () => {
    mockApi((path) => (path === '/settings' ? jsonResponse(200, { minAttendance: 75, code: 'etec-jau', grading: null }) : undefined));
    renderAt('/configuracoes');
    await screen.findByDisplayValue('etec-jau');
    expect(skeletons()).toHaveLength(0);
  });
});

describe('esqueleto das turmas do professor na presença', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));
  const teacher = {
    id: 9, name: 'Ana Prado', email: 'a@b.c', role: 'TEACHER', mustChangePassword: false,
    school: { id: 1, name: 'ETEC Jaú', plan: 'ASSESSMENTS', modules: ALL_MODULES },
  };

  it('pendente mostra esqueleto; liberada vazia mostra o aviso, sem esqueleto', async () => {
    const release = holdApi('/attendance/my-lessons', undefined, teacher);
    renderAt('/presenca');
    await waitFor(() => expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0));
    await act(async () => release(jsonResponse(200, { date: todayIso(), day: { kind: 'SCHOOL_DAY' }, classGroups: [], lessons: [] })));
    expect(await screen.findByText(/não leciona em nenhuma turma/i)).toBeInTheDocument();
    expect(document.querySelectorAll('.skeleton')).toHaveLength(0);
  });
});
