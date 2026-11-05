/**
 * Protocolo de comunicação com o Arduino + sensor biométrico,
 * idêntico ao usado pelo sistema legado (WinForms).
 */
export const SerialCommands = {
  /** Enviado ao conectar/desconectar para limpar o estado do Arduino. */
  reset: '!empty#',
  /** Cadastra a digital na posição informada. */
  enroll: (slot: number) => `!enroll${slot}#`,
  /** Inicia o modo de verificação contínua. */
  verify: '!verify#',
  /** Interrompe a verificação. */
  stop: '!a#',
} as const;

export type SerialEvent =
  | { type: 'enrolling' }
  | { type: 'place-finger' }
  | { type: 'image-taken' }
  | { type: 'remove-finger' }
  | { type: 'enrolled'; slot: number | null }
  | { type: 'mismatch' }
  | { type: 'found'; slot: number }
  | { type: 'unknown'; raw: string };

const extractNumber = (line: string, prefix: string) => {
  const value = Number.parseInt(line.slice(prefix.length).replace('#', '').trim(), 10);
  return Number.isNaN(value) ? null : value;
};

export function parseSerialLine(rawLine: string): SerialEvent {
  const line = rawLine.trim();
  if (line.startsWith('!enrolling')) return { type: 'enrolling' };
  if (line.startsWith('!placeFinger')) return { type: 'place-finger' };
  if (line.startsWith('!imageTaken')) return { type: 'image-taken' };
  if (line.startsWith('!removeFinger')) return { type: 'remove-finger' };
  if (line.startsWith('!enrolled')) return { type: 'enrolled', slot: extractNumber(line, '!enrolled') };
  if (line.startsWith('Fingerprints did not match')) return { type: 'mismatch' };
  if (line.startsWith('!found')) {
    const slot = extractNumber(line, '!found');
    if (slot !== null) return { type: 'found', slot };
  }
  return { type: 'unknown', raw: line };
}

/** Mensagens exibidas durante o cadastro da digital (mesmos textos do legado). */
export function enrollmentMessage(event: SerialEvent): string | null {
  switch (event.type) {
    case 'enrolling':
    case 'place-finger':
      return 'Coloque o dedo no sensor';
    case 'image-taken':
      return 'Dedo capturado';
    case 'remove-finger':
      return 'Tire o dedo do sensor';
    case 'enrolled':
      return event.slot ? `ID ${event.slot} cadastrado` : 'Digital cadastrada';
    case 'mismatch':
      return 'As digitais não conferem. Coloque o dedo novamente';
    default:
      return null;
  }
}

/** Separa um fluxo de texto em linhas completas, guardando o resto parcial. */
export function splitLines(buffer: string): { lines: string[]; rest: string } {
  const parts = buffer.split(/\r?\n/);
  const rest = parts.pop() ?? '';
  return { lines: parts.map((part) => part.trim()).filter(Boolean), rest };
}
