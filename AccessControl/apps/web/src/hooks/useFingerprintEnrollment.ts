import { useCallback, useEffect, useRef, useState } from 'react';
import { studentsApi } from '../api';
import { errorMessage } from '../api/client';
import type { Student } from '../api/types';
import { useSerial } from '../contexts/SerialContext';
import { SerialCommands, enrollmentMessage } from '../serial/protocol';

export type EnrollmentStatus = 'idle' | 'running' | 'done' | 'error';

interface EnrollmentState {
  status: EnrollmentStatus;
  message: string;
  student: Student | null;
}

const IDLE: EnrollmentState = { status: 'idle', message: 'N/A', student: null };

/**
 * Fluxo de cadastro da digital (antigo serialPort_DataReceived do frmListaAlunos):
 * reserva a posição na API, envia "!enroll<n>#" e acompanha as mensagens do Arduino.
 */
export function useFingerprintEnrollment(onEnrolled: (student: Student) => void) {
  const serial = useSerial();
  const [state, setState] = useState<EnrollmentState>(IDLE);
  const active = useRef<{ student: Student; slot: number } | null>(null);
  const onEnrolledRef = useRef(onEnrolled);
  onEnrolledRef.current = onEnrolled;

  useEffect(
    () =>
      serial.subscribe(async (event) => {
        const current = active.current;
        if (!current) return;

        if (event.type === 'mismatch') {
          // Igual ao legado: se as digitais não conferem, reinicia o cadastro na mesma posição.
          await serial.send(SerialCommands.enroll(current.slot)).catch(() => undefined);
        }

        const message = enrollmentMessage(event);
        if (message) setState((prev) => ({ ...prev, message }));

        if (event.type === 'enrolled') {
          active.current = null;
          try {
            const student = await studentsApi.confirmFingerprint(current.student.id);
            setState({ status: 'done', message: message ?? 'Digital cadastrada', student });
            onEnrolledRef.current(student);
          } catch (err) {
            setState({ status: 'error', message: errorMessage(err), student: current.student });
          }
        }
      }),
    [serial],
  );

  const start = useCallback(
    async (student: Student) => {
      if (!serial.connected) {
        setState({ status: 'error', message: 'Arduino não conectado. Conecte-o em Configurações.', student });
        return;
      }
      try {
        setState({ status: 'running', message: 'Preparando o sensor...', student });
        const { fingerprintId } = await studentsApi.reserveFingerprint(student.id);
        active.current = { student, slot: fingerprintId };
        await serial.send(SerialCommands.enroll(fingerprintId));
        setState({ status: 'running', message: 'Coloque o dedo no sensor', student });
      } catch (err) {
        active.current = null;
        setState({ status: 'error', message: errorMessage(err), student });
      }
    },
    [serial],
  );

  const reset = useCallback(() => {
    active.current = null;
    setState(IDLE);
  }, []);

  return { ...state, start, reset };
}
