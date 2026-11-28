import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentSchoolYear, todayIso } from '../src/utils/academic';
import { jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

/** Resposta que só chega quando o teste mandar: simula a rede lenta numa carga antiga. */
function deferred(status: number, body: unknown) {
  let release!: () => void;
  const response = new Promise<Response>((resolve) => {
    release = () => resolve(jsonResponse(status, body));
  });
  return { response, release: () => act(async () => release()) };
}

beforeEach(() => setMockSession({ access_token: 'jwt' }));

describe('Respostas atrasadas não sobrescrevem a tela', () => {
  it('Presença: a chamada da turma anterior chegando depois não substitui a da turma atual', async () => {
    const MATH = { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#2266aa' };
    const day = (student: string) => ({
      date: todayIso(),
      day: { kind: 'SCHOOL_DAY' },
      lessons: [{ startMinute: 450, endMinute: 500, subject: MATH, teacher: null, cancellation: null, finished: true }],
      students: [{ id: student.length, name: student, rm: '1', marks: [{ startMinute: 450, present: true, source: 'AUTO' }] }],
    });
    const slow = deferred(200, day('Ana Souza'));
    mockApi((path) => {
      if (path.startsWith('/class-groups?')) {
        return jsonResponse(200, [
          { id: 20, name: '2º DS A', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 1 },
          { id: 21, name: '2º DS B', schoolYear: 2026, shift: 'MORNING', course: null, studentsCount: 1 },
        ]);
      }
      if (path.startsWith('/attendance/day?classGroupId=20')) return slow.response as never;
      if (path.startsWith('/attendance/day?classGroupId=21')) return jsonResponse(200, day('Carla Dias'));
      return undefined;
    });
    renderAt('/presenca');

    await screen.findByRole('option', { name: '2º DS B' });
    await userEvent.selectOptions(screen.getByLabelText('Turma'), '21');
    const mark = (name: string) => screen.queryByRole('button', { name: new RegExp(`^${name}, aula das 07:30`) });
    expect(await screen.findByRole('button', { name: /^Carla Dias, aula das 07:30/ })).toBeInTheDocument();

    await slow.release();
    expect(mark('Carla Dias')).toBeInTheDocument();
    expect(mark('Ana Souza')).not.toBeInTheDocument();
  });

  it('Calendário: o ano anterior chegando depois não substitui os bimestres do ano escolhido', async () => {
    const YEAR = currentSchoolYear();
    const calendar = (year: number, start: string) => ({
      year,
      holidaysLoaded: true,
      holidays: [],
      noClassDays: [],
      terms: [{ number: 1, startDate: start, endDate: `${year}-04-30` }],
    });
    const slow = deferred(200, calendar(YEAR, `${YEAR}-02-01`));
    mockApi((path) => {
      if (path === `/calendar?year=${YEAR}`) return slow.response as never;
      if (path === `/calendar?year=${YEAR + 1}`) return jsonResponse(200, calendar(YEAR + 1, `${YEAR + 1}-02-10`));
      return undefined;
    });
    renderAt('/calendario');

    await userEvent.selectOptions(await screen.findByLabelText('Ano'), String(YEAR + 1));
    const start = await screen.findByLabelText('Início do 1º bimestre');
    expect(await within(start.closest('form')!).findByDisplayValue(`${YEAR + 1}-02-10`)).toBeInTheDocument();

    await slow.release();
    expect(screen.getByLabelText('Início do 1º bimestre')).toHaveValue(`${YEAR + 1}-02-10`);
  });
});
