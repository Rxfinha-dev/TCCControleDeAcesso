import { ReadableStream, TextDecoderStream, WritableStream } from 'node:stream/web';

/** Leitor de digital simulado: uma porta Web Serial em memória, com o que o Arduino "envia" e o que recebeu. */
export function installFakeSerial({ usbVendorId = 0x2341, usbProductId = 0x43 }: { usbVendorId?: number; usbProductId?: number } = {}) {
  // O jsdom não expõe as Web Streams: usa as do Node.
  Object.assign(globalThis, { ReadableStream, WritableStream, TextDecoderStream });

  let arduino!: ReadableStreamDefaultController<Uint8Array>;
  const written: string[] = [];
  const decoder = new TextDecoder();
  const port = {
    readable: new ReadableStream<Uint8Array>({
      start(controller) {
        arduino = controller;
      },
    }),
    writable: new WritableStream<Uint8Array>({
      write(chunk) {
        written.push(decoder.decode(chunk));
      },
    }),
    open: jest.fn(async (_options: { baudRate: number }) => undefined),
    close: jest.fn(async () => undefined),
    getInfo: () => ({ usbVendorId, usbProductId }),
  };

  const listeners = new Set<(event: { target: unknown }) => void>();
  const serial = {
    requestPort: jest.fn(async () => port),
    addEventListener: jest.fn((_type: string, listener: (event: { target: unknown }) => void) => listeners.add(listener)),
    removeEventListener: jest.fn((_type: string, listener: (event: { target: unknown }) => void) => listeners.delete(listener)),
  };
  Object.defineProperty(navigator, 'serial', { value: serial, configurable: true });

  return {
    port,
    serial,
    /** Comandos recebidos pelo Arduino, na ordem. */
    written,
    /** O Arduino envia um texto (pode ser parte de uma linha). */
    emit: (text: string) => arduino.enqueue(new TextEncoder().encode(text)),
    /** A leitura falha (ex.: cabo com mau contato). */
    fail: () => arduino.error(new Error('falha de leitura')),
    /** O navegador avisa que o dispositivo foi removido. */
    unplug: (target: unknown = port) => listeners.forEach((listener) => listener({ target })),
  };
}

/** Deixa as promessas e streams pendentes andarem. */
export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
