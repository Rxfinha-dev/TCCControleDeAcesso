import { splitLines } from './protocol';

type LineListener = (line: string) => void;

export const isSerialSupported = () => typeof navigator !== 'undefined' && 'serial' in navigator;

/**
 * Conexão com o Arduino usando a Web Serial API (Chrome/Edge).
 * Equivalente ao antigo SerialPortManager do WinForms.
 */
export class SerialConnection {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private pipeClosed: Promise<void> | null = null;
  private listeners = new Set<LineListener>();
  private onDisconnect: (() => void) | null = null;

  get connected() {
    return this.port !== null;
  }

  get portLabel() {
    const info = this.port?.getInfo();
    if (!info?.usbVendorId) return this.port ? 'Porta serial' : null;
    return `USB ${info.usbVendorId.toString(16).padStart(4, '0')}:${(info.usbProductId ?? 0).toString(16).padStart(4, '0')}`;
  }

  setDisconnectHandler(handler: (() => void) | null) {
    this.onDisconnect = handler;
  }

  async connect(baudRate: number) {
    if (!isSerialSupported()) throw new Error('Seu navegador não suporta Web Serial. Use o Google Chrome ou Microsoft Edge.');
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate });
    this.port = port;
    navigator.serial.addEventListener('disconnect', this.handleDeviceLost);
    void this.readLoop(port);
  }

  async disconnect() {
    const port = this.port;
    if (!port) return;
    this.port = null;
    navigator.serial.removeEventListener('disconnect', this.handleDeviceLost);
    try {
      await this.reader?.cancel();
      await this.pipeClosed;
      this.reader?.releaseLock();
      await port.close();
    } catch {
      // A porta pode já ter sido fechada (cabo removido).
    }
    this.reader = null;
    this.onDisconnect?.();
  }

  async send(command: string) {
    if (!this.port?.writable) throw new Error('Arduino não está conectado. Conecte-o em Configurações.');
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(command));
    } finally {
      writer.releaseLock();
    }
  }

  subscribe(listener: LineListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleDeviceLost = (event: Event) => {
    if (event.target === this.port) void this.disconnect();
  };

  private async readLoop(port: SerialPort) {
    if (!port.readable) return;
    const decoder = new TextDecoderStream();
    this.pipeClosed = port.readable.pipeTo(decoder.writable as WritableStream<Uint8Array>).catch(() => undefined);
    this.reader = decoder.readable.getReader();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        const { lines, rest } = splitLines(buffer + value);
        buffer = rest;
        lines.forEach((line) => this.listeners.forEach((listener) => listener(line)));
      }
    } catch {
      if (this.port === port) await this.disconnect();
    }
  }
}
