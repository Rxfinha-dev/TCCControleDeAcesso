import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentSchoolYear } from '../src/utils/academic';
import { bodyOf, callsTo, jsonResponse, mockApi, renderAt } from './harness';
import { setMockSession } from './mocks/supabase';

const YEAR = currentSchoolYear();
const calendar = (over: object = {}) => ({
  year: YEAR,
  holidaysLoaded: true,
  holidays: [
    { date: `${YEAR}-04-21`, name: 'Tiradentes', active: true },
    { date: `${YEAR}-12-25`, name: 'Natal', active: true },
  ],
  noClassDays: [{ id: 7, name: 'Recesso de julho', startDate: `${YEAR}-07-13`, endDate: `${YEAR}-07-24` }],
  terms: [],
  ...over,
});

const setup = (data: object = calendar()) =>
  mockApi((path, method) => {
    if (path.startsWith('/calendar?') && method === 'GET') return jsonResponse(200, data);
    if (path.startsWith('/calendar/holidays/') && method === 'PUT') return jsonResponse(204, undefined);
    if (path === '/calendar/no-class-days' && method === 'POST')
      return jsonResponse(201, { id: 8, name: 'Conselho de classe', startDate: `${YEAR}-05-08`, endDate: `${YEAR}-05-08` });
    if (path === '/calendar/no-class-days/7' && method === 'DELETE') return jsonResponse(204, undefined);
    if (path === `/calendar/terms/${YEAR}` && method === 'PUT') return jsonResponse(200, []);
    return undefined;
  });

describe('Calendário', () => {
  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  it('aparece no menu e pede o calendário do ano atual', async () => {
    const fetchMock = setup();
    renderAt('/calendario');

    expect(await screen.findByRole('heading', { name: 'Calendário' })).toBeInTheDocument();
    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Calendário' })).toBeInTheDocument();
    await screen.findByText('Tiradentes');
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith(`/calendar?year=${YEAR}`))).toBe(true);
  });

  it('desmarca um feriado nacional (vira dia letivo)', async () => {
    const fetchMock = setup();
    renderAt('/calendario');

    const toggle = await screen.findByRole('checkbox', { name: 'Tiradentes: sem aula' });
    expect(toggle).toBeChecked();
    await userEvent.click(toggle);

    await waitFor(() => expect(callsTo(fetchMock, `/calendar/holidays/${YEAR}-04-21`, 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, `/calendar/holidays/${YEAR}-04-21`, 'PUT')[0])).toEqual({ active: false });
  });

  it('avisa quando os feriados não puderam ser carregados', async () => {
    setup(calendar({ holidaysLoaded: false, holidays: [] }));
    renderAt('/calendario');

    expect(await screen.findByText(/Não foi possível carregar os feriados nacionais/)).toBeInTheDocument();
  });

  it('adiciona dia sem aula de data única e exclui outro depois de confirmar', async () => {
    const fetchMock = setup();
    renderAt('/calendario');

    await screen.findByText('Recesso de julho');
    await userEvent.type(screen.getByLabelText('Nome'), 'Conselho de classe');
    fireEvent.change(screen.getByLabelText('De'), { target: { value: `${YEAR}-05-08` } });
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => expect(callsTo(fetchMock, '/calendar/no-class-days', 'POST')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, '/calendar/no-class-days', 'POST')[0])).toEqual({
      name: 'Conselho de classe',
      startDate: `${YEAR}-05-08`,
    });

    const row = screen.getByText('Recesso de julho').closest('tr')!;
    expect(within(row).getByText(`13/07/${YEAR} a 24/07/${YEAR}`)).toBeInTheDocument();
    await userEvent.click(within(row).getByRole('button', { name: 'Excluir' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(callsTo(fetchMock, '/calendar/no-class-days/7', 'DELETE')).toHaveLength(1));
  });

  it('salva os 4 bimestres', async () => {
    const fetchMock = setup();
    renderAt('/calendario');

    await screen.findByText('Tiradentes');
    const dates = [
      ['02-02', '04-17'],
      ['04-22', '07-03'],
      ['07-27', '10-02'],
      ['10-05', '12-11'],
    ];
    dates.forEach(([start, end], index) => {
      fireEvent.change(screen.getByLabelText(`Início do ${index + 1}º bimestre`), { target: { value: `${YEAR}-${start}` } });
      fireEvent.change(screen.getByLabelText(`Fim do ${index + 1}º bimestre`), { target: { value: `${YEAR}-${end}` } });
    });
    await userEvent.click(screen.getByRole('button', { name: 'Salvar bimestres' }));

    await waitFor(() => expect(callsTo(fetchMock, `/calendar/terms/${YEAR}`, 'PUT')).toHaveLength(1));
    expect(bodyOf(callsTo(fetchMock, `/calendar/terms/${YEAR}`, 'PUT')[0])).toEqual({
      terms: dates.map(([start, end], index) => ({ number: index + 1, startDate: `${YEAR}-${start}`, endDate: `${YEAR}-${end}` })),
    });
  });

  it('não envia bimestres incompletos', async () => {
    const fetchMock = setup();
    renderAt('/calendario');

    await screen.findByText('Tiradentes');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar bimestres' }));

    expect(await screen.findByText('Preencha o início e o fim dos 4 bimestres')).toBeInTheDocument();
    expect(callsTo(fetchMock, `/calendar/terms/${YEAR}`, 'PUT')).toHaveLength(0);
  });
});
