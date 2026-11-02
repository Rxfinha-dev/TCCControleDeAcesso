import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SerialCommands, parseSerialLine, type SerialEvent } from '../serial/protocol';
import { SerialConnection, isSerialSupported } from '../serial/SerialConnection';

interface SerialContextValue {
  supported: boolean;
  connected: boolean;
  portLabel: string | null;
  connect: (baudRate: number) => Promise<void>;
  disconnect: () => Promise<void>;
  send: (command: string) => Promise<void>;
  /** Recebe cada mensagem do Arduino já interpretada. */
  subscribe: (listener: (event: SerialEvent) => void) => () => void;
}

const SerialContext = createContext<SerialContextValue | null>(null);

/** Mantém a conexão com o Arduino aberta enquanto o usuário navega entre as telas. */
export function SerialProvider({ children }: { children: ReactNode }) {
  const [connection] = useState(() => new SerialConnection());
  const [connected, setConnected] = useState(false);
  const [portLabel, setPortLabel] = useState<string | null>(null);

  useEffect(() => {
    connection.setDisconnectHandler(() => {
      setConnected(false);
      setPortLabel(null);
    });
    return () => {
      connection.setDisconnectHandler(null);
      void connection.disconnect();
    };
  }, [connection]);

  const connect = useCallback(
    async (baudRate: number) => {
      await connection.connect(baudRate);
      setConnected(true);
      setPortLabel(connection.portLabel);
      await connection.send(SerialCommands.reset);
    },
    [connection],
  );

  const disconnect = useCallback(async () => {
    await connection.send(SerialCommands.reset).catch(() => undefined);
    await connection.disconnect();
  }, [connection]);

  const send = useCallback((command: string) => connection.send(command), [connection]);

  const subscribe = useCallback(
    (listener: (event: SerialEvent) => void) => connection.subscribe((line) => listener(parseSerialLine(line))),
    [connection],
  );

  const value = useMemo(
    () => ({ supported: isSerialSupported(), connected, portLabel, connect, disconnect, send, subscribe }),
    [connected, portLabel, connect, disconnect, send, subscribe],
  );
  return <SerialContext.Provider value={value}>{children}</SerialContext.Provider>;
}

export function useSerial() {
  const context = useContext(SerialContext);
  if (!context) throw new Error('useSerial deve ser usado dentro de <SerialProvider>');
  return context;
}
