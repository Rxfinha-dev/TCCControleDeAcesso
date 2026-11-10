import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const studentWithoutCourse = {
  id: 7,
  name: 'Bruno Lima',
  rm: '9001',
  age: 14,
  year: null,
  course: null,
  hasPhoto: false,
  fingerprintId: null,
  fingerprintEnrolled: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('Aluno sem curso e sem série', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('mostra "—" na lista e salva sem curso nem série', async () => {
    const fetchMock = mockApi((path, method) => {
      if (path.startsWith('/students') && method === 'GET') return jsonResponse(200, [studentWithoutCourse]);
      if (path === '/students/7' && method === 'PUT') return jsonResponse(200, studentWithoutCourse);
      if (path === '/courses') return jsonResponse(200, [{ id: 3, name: 'DS' }]);
      return undefined;
    });
    renderAt('/alunos');

    const row = (await screen.findByText('Bruno Lima', {}, { timeout: 5000 })).closest('tr')!; // timeout maior: a suíte completa deixa a renderização lenta
    expect(within(row).getAllByText('—')).toHaveLength(2);

    await userEvent.click(row);
    expect(screen.getByLabelText('Curso')).toHaveValue('');
    expect(screen.getByLabelText('Série')).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(callsTo(fetchMock, '/students/7', 'PUT')).toHaveLength(1));
    const form = callsTo(fetchMock, '/students/7', 'PUT')[0][1].body as FormData;
    expect(form.get('courseId')).toBe('');
    expect(form.get('year')).toBe('');
  });
});
