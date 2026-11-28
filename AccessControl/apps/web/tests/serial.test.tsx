import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SerialProvider, useSerial } from '../src/contexts/SerialContext';
import { useFingerprintEnrollment } from '../src/hooks/useFingerprintEnrollment';
import { SerialConnection } from '../src/serial/SerialConnection';
import { callsTo, jsonResponse, mockApi } from './harness';
import { flush, installFakeSerial } from './mocks/serial';
import { setMockSession } from './mocks/supabase';

describe('SerialConnection', () => {
  it('sem Web Serial no navegador, conectar explica o motivo', async () => {
    delete (navigator as { serial?: unknown }).serial;
    await expect(new SerialConnection().connect(9600)).rejects.toThrow('Seu navegador não suporta Web Serial');
  });

  it('conecta na velocidade escolhida e identifica a porta USB', async () => {
    const arduino = installFakeSerial();
    const connection = new SerialConnection();
    expect(connection.connected).toBe(false);
    expect(connection.portLabel).toBeNull();

    await connection.connect(115200);

    expect(arduino.port.open).toHaveBeenCalledWith({ baudRate: 115200 });
    expect(connection.connected).toBe(true);
    expect(connection.portLabel).toBe('USB 2341:0043');
  });

  it('porta sem identificação USB aparece como "Porta serial"', async () => {
    installFakeSerial({ usbVendorId: 0 });
    const connection = new SerialConnection();
    await connection.connect(9600);
    expect(connection.portLabel).toBe('Porta serial');
  });

  it('envia comandos ao Arduino e recusa enviar sem conexão', async () => {
    const arduino = installFakeSerial();
    const connection = new SerialConnection();
    await expect(connection.send('!verify#')).rejects.toThrow('Arduino não está conectado');

    await connection.connect(9600);
    await connection.send('!verify#');
    await connection.send('!a#');
    expect(arduino.written).toEqual(['!verify#', '!a#']);
  });

  it('entrega cada linha completa, mesmo quando chega em pedaços', async () => {
    const arduino = installFakeSerial();
    const connection = new SerialConnection();
    const lines: string[] = [];
    const unsubscribe = connection.subscribe((line) => lines.push(line));
    await connection.connect(9600);

    arduino.emit('!found');
    arduino.emit('12#\r\n!placeFin');
    await flush();
    expect(lines).toEqual(['!found12#']);

    arduino.emit('ger\n');
    await flush();
    expect(lines).toEqual(['!found12#', '!placeFinger']);

    unsubscribe();
    arduino.emit('!removeFinger\n');
    await flush();
    expect(lines).toHaveLength(2);
  });

  it('desconectar fecha a porta e avisa quem estava ouvindo', async () => {
    const arduino = installFakeSerial();
    const connection = new SerialConnection();
    const onDisconnect = jest.fn();
    connection.setDisconnectHandler(onDisconnect);
    await connection.connect(9600);

    await connection.disconnect();

    expect(connection.connected).toBe(false);
    expect(arduino.port.close).toHaveBeenCalled();
    expect(arduino.serial.removeEventListener).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(onDisconnect).toHaveBeenCalledTimes(1);
    // Desconectar de novo não faz nada.
    await connection.disconnect();
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('cabo removido desconecta; aviso de outro dispositivo é ignorado', async () => {
    const arduino = installFakeSerial();
    const connection = new SerialConnection();
    const onDisconnect = jest.fn();
    connection.setDisconnectHandler(onDisconnect);
    await connection.connect(9600);

    arduino.unplug({});
    await flush();
    expect(connection.connected).toBe(true);

    arduino.unplug();
    await waitFor(() => expect(onDisconnect).toHaveBeenCalled());
    expect(connection.connected).toBe(false);
  });

  it('falha na leitura desconecta o leitor', async () => {
    const arduino = installFakeSerial();
    const connection = new SerialConnection();
    const onDisconnect = jest.fn();
    connection.setDisconnectHandler(onDisconnect);
    await connection.connect(9600);

    arduino.fail();

    await waitFor(() => expect(onDisconnect).toHaveBeenCalled());
    expect(connection.connected).toBe(false);
  });
});

describe('useFingerprintEnrollment', () => {
  const ANA = {
    id: 7,
    name: 'Ana Souza',
    rm: '9001',
    age: 15,
    year: null,
    course: null,
    hasPhoto: false,
    fingerprintId: null,
    fingerprintEnrolled: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
  const wrapper = ({ children }: { children: ReactNode }) => <SerialProvider>{children}</SerialProvider>;

  beforeEach(() => setMockSession({ access_token: 'jwt' }));

  /** API simulada: reserva a posição 5 e confirma (ou falha) no fim. */
  const api = ({ reserve = 200, confirm = 200 } = {}) =>
    mockApi((path, method) => {
      if (path === '/students/7/fingerprint' && method === 'POST') {
        return reserve === 200 ? jsonResponse(200, { fingerprintId: 5 }) : jsonResponse(reserve, { message: 'Sem posição livre no sensor' });
      }
      if (path === '/students/7/fingerprint/confirm' && method === 'POST') {
        return confirm === 200
          ? jsonResponse(200, { ...ANA, fingerprintId: 5, fingerprintEnrolled: true })
          : jsonResponse(confirm, { message: 'Não foi possível confirmar a digital' });
      }
      return undefined;
    });

  /** Hook montado com o leitor simulado já conectado. */
  async function setup() {
    const arduino = installFakeSerial();
    const onEnrolled = jest.fn();
    const hook = renderHook(() => ({ serial: useSerial(), enrollment: useFingerprintEnrollment(onEnrolled) }), { wrapper });
    await act(() => hook.result.current.serial.connect(9600));
    arduino.written.length = 0; // descarta o "!empty#" da conexão
    const say = (line: string) => act(async () => {
      arduino.emit(`${line}\n`);
      await flush();
    });
    return { arduino, onEnrolled, hook, say };
  }

  it('sem o Arduino conectado, avisa e não reserva posição', async () => {
    const fetchMock = api();
    installFakeSerial();
    const { result } = renderHook(() => useFingerprintEnrollment(jest.fn()), { wrapper });

    await act(() => result.current.start(ANA));

    expect(result.current.status).toBe('error');
    expect(result.current.message).toBe('Arduino não conectado. Conecte-o em Configurações.');
    expect(callsTo(fetchMock, '/students/7/fingerprint', 'POST')).toHaveLength(0);
  });

  it('cadastro concluído: reserva, manda o sensor gravar, acompanha as mensagens e confirma na API', async () => {
    const fetchMock = api();
    const { arduino, onEnrolled, hook, say } = await setup();

    await act(() => hook.result.current.enrollment.start(ANA));
    expect(arduino.written).toEqual(['!enroll5#']);
    expect(hook.result.current.enrollment).toMatchObject({ status: 'running', message: 'Coloque o dedo no sensor', student: ANA });

    await say('!imageTaken');
    expect(hook.result.current.enrollment.message).toBe('Dedo capturado');
    await say('!removeFinger');
    expect(hook.result.current.enrollment.message).toBe('Tire o dedo do sensor');

    // Digitais diferentes: o sensor recomeça na mesma posição.
    await say('Fingerprints did not match');
    expect(arduino.written).toEqual(['!enroll5#', '!enroll5#']);
    expect(hook.result.current.enrollment.message).toBe('As digitais não conferem. Coloque o dedo novamente');

    await say('!enrolled5#');
    await waitFor(() => expect(hook.result.current.enrollment.status).toBe('done'));
    expect(hook.result.current.enrollment.message).toBe('ID 5 cadastrado');
    expect(callsTo(fetchMock, '/students/7/fingerprint/confirm', 'POST')).toHaveLength(1);
    expect(onEnrolled).toHaveBeenCalledWith(expect.objectContaining({ id: 7, fingerprintEnrolled: true }));
  });

  it('falha ao reservar a posição vira erro sem mandar nada ao sensor', async () => {
    api({ reserve: 409 });
    const { arduino, hook } = await setup();

    await act(() => hook.result.current.enrollment.start(ANA));

    expect(hook.result.current.enrollment).toMatchObject({ status: 'error', message: 'Sem posição livre no sensor' });
    expect(arduino.written).toEqual([]);
  });

  it('falha ao confirmar na API mostra o erro e não avisa a tela', async () => {
    api({ confirm: 500 });
    const { onEnrolled, hook, say } = await setup();

    await act(() => hook.result.current.enrollment.start(ANA));
    await say('!enrolled5#');

    await waitFor(() => expect(hook.result.current.enrollment.status).toBe('error'));
    expect(hook.result.current.enrollment.message).toBe('Não foi possível confirmar a digital');
    expect(onEnrolled).not.toHaveBeenCalled();
  });

  it('cadastro cancelado: mensagens que chegam depois são ignoradas', async () => {
    const fetchMock = api();
    const { onEnrolled, hook, say } = await setup();

    await act(() => hook.result.current.enrollment.start(ANA));
    act(() => hook.result.current.enrollment.reset());
    expect(hook.result.current.enrollment).toMatchObject({ status: 'idle', student: null });

    await say('!imageTaken');
    await say('!enrolled5#');
    expect(hook.result.current.enrollment.status).toBe('idle');
    expect(callsTo(fetchMock, '/students/7/fingerprint/confirm', 'POST')).toHaveLength(0);
    expect(onEnrolled).not.toHaveBeenCalled();
  });
});
