import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { formatMinute } from '../src/utils/academic';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
const ANA = { id: 5, name: 'Ana Prado', contactEmail: 'ana@escola.com', assignmentsCount: 0 };

describe('Disciplinas e professores', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('formatMinute escreve HH:MM', () => {
    expect(formatMinute(450)).toBe('07:30');
    expect(formatMinute(1440)).toBe('24:00');
  });

  it('menu mostra Turmas, Disciplinas e Professores para login de escola', async () => {
    mockApi();
    renderAt('/');
    const nav = await screen.findByRole('navigation');
    for (const label of ['Turmas', 'Disciplinas', 'Professores']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('lista e cria disciplina com nome, sigla e cor', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path === '/subjects' && method === 'GET') return jsonResponse(200, [MATH]);
      if (path === '/subjects' && method === 'POST') return jsonResponse(201, { id: 2, name: 'História', abbreviation: 'HIS', color: '#aa3322' });
      return undefined;
    });
    renderAt('/disciplinas');

    expect(await screen.findByText('Matemática')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nome'), 'História');
    await userEvent.type(screen.getByLabelText('Sigla'), 'HIS');
    fireEvent.input(screen.getByLabelText('Cor'), { target: { value: '#aa3322' } });
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(callsTo(fetchMock, '/subjects', 'POST')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/subjects', 'POST')[0])).toEqual({ name: 'História', abbreviation: 'HIS', color: '#aa3322' });
  });

  it('mostra a mensagem do 409 ao excluir disciplina em uso', async () => {
    mockApi((path, method) => {
      if (path === '/subjects' && method === 'GET') return jsonResponse(200, [MATH]);
      if (path === '/subjects/1' && method === 'DELETE')
        return jsonResponse(409, { code: 'SUBJECT_IN_USE', message: 'Não é possível excluir: a disciplina está em uso em turmas ou na grade.' });
      return undefined;
    });
    renderAt('/disciplinas');

    await userEvent.click(await screen.findByText('Matemática'));
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText(/a disciplina está em uso/)).toBeInTheDocument();
  });

  it('lista, cria e edita professor', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path === '/teachers' && method === 'GET') return jsonResponse(200, [ANA]);
      if (path === '/teachers' && method === 'POST') return jsonResponse(201, { id: 6, name: 'Bruno Reis', contactEmail: null, assignmentsCount: 0 });
      if (path === '/teachers/5' && method === 'PUT') return jsonResponse(200, { ...ANA, name: 'Ana Prado Lima' });
      return undefined;
    });
    renderAt('/professores');

    expect(await screen.findByText('Ana Prado')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nome'), 'Bruno Reis');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    await waitFor(() => expect(callsTo(fetchMock, '/teachers', 'POST')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/teachers', 'POST')[0])).toEqual({ name: 'Bruno Reis', contactEmail: '' });

    await userEvent.click(await screen.findByText('Ana Prado'));
    expect(screen.getByLabelText('E-mail de contato')).toHaveValue('ana@escola.com');
    await userEvent.type(screen.getByLabelText('Nome'), ' Lima');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(callsTo(fetchMock, '/teachers/5', 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/teachers/5', 'PUT')[0])).toEqual({ name: 'Ana Prado Lima', contactEmail: 'ana@escola.com' });
  });
});
