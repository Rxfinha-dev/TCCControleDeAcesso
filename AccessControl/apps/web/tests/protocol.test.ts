import { SerialCommands, enrollmentMessage, parseSerialLine, splitLines } from '../src/serial/protocol';

describe('Protocolo serial do Arduino', () => {
  it('monta os mesmos comandos do sistema legado', () => {
    expect(SerialCommands.enroll(12)).toBe('!enroll12#');
    expect(SerialCommands.verify).toBe('!verify#');
    expect(SerialCommands.stop).toBe('!a#');
    expect(SerialCommands.reset).toBe('!empty#');
  });

  it.each([
    ['!enrolling', { type: 'enrolling' }],
    ['!placeFinger#', { type: 'place-finger' }],
    ['!imageTaken#', { type: 'image-taken' }],
    ['!removeFinger#', { type: 'remove-finger' }],
    ['!enrolled7#', { type: 'enrolled', slot: 7 }],
    ['Fingerprints did not match', { type: 'mismatch' }],
    ['!found15#\r', { type: 'found', slot: 15 }],
  ])('interpreta "%s"', (line, expected) => {
    expect(parseSerialLine(line)).toEqual(expected);
  });

  it('marca mensagens desconhecidas', () => {
    expect(parseSerialLine('Sensor ok')).toEqual({ type: 'unknown', raw: 'Sensor ok' });
    expect(parseSerialLine('!foundabc#')).toEqual({ type: 'unknown', raw: '!foundabc#' });
  });

  it('traduz eventos em mensagens de cadastro', () => {
    expect(enrollmentMessage({ type: 'place-finger' })).toBe('Coloque o dedo no sensor');
    expect(enrollmentMessage({ type: 'image-taken' })).toBe('Dedo capturado');
    expect(enrollmentMessage({ type: 'remove-finger' })).toBe('Tire o dedo do sensor');
    expect(enrollmentMessage({ type: 'enrolled', slot: 3 })).toBe('ID 3 cadastrado');
    expect(enrollmentMessage({ type: 'found', slot: 3 })).toBeNull();
  });

  it('separa o fluxo serial em linhas completas', () => {
    expect(splitLines('!placeFinger#\r\n!imageTa')).toEqual({ lines: ['!placeFinger#'], rest: '!imageTa' });
    expect(splitLines('!imageTaken#\n\n!removeFinger#\n')).toEqual({
      lines: ['!imageTaken#', '!removeFinger#'],
      rest: '',
    });
  });
});
