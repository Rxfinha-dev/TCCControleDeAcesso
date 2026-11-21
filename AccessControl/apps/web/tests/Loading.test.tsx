import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

/** Esqueleto de carregamento das tabelas: a resposta da API é segurada por uma promessa até o teste liberá-la. */

const aluno = { id: 1, name: 'Ana Souza', rm: '123', grade: '1', courseId: 1, course: { id: 1, name: 'Info' }, fingerprintId: null };

/** Mock em que `path` fica pendente até `release` ser chamada; o resto responde por `others`. */
function holdApi(path: string) {
  let release: (res: Response) => void = () => {};
  const held = new Promise<Response>((resolve) => (release = resolve));
  const fetchMock = mockApi();
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
    await act(async () => release(jsonResponse(200, [aluno])));
    expect(await screen.findByText('Ana Souza')).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
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
