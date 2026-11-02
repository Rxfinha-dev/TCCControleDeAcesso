import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { accessLogsApi } from '../api';
import { errorMessage } from '../api/client';
import type { EntryResult } from '../api/types';
import { FingerprintIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { StudentPhoto } from '../components/StudentPhoto';
import { useSerial } from '../contexts/SerialContext';
import { useToast } from '../contexts/ToastContext';
import { SerialCommands } from '../serial/protocol';
import { formatTime, yearLabel } from '../utils/format';

/** Tela de verificação (frmVerificacao): lê a digital, mostra o aluno e registra a entrada. */
export function VerificationPage() {
  const serial = useSerial();
  const toast = useToast();
  const [verifying, setVerifying] = useState(false);
  const [current, setCurrent] = useState<EntryResult | null>(null);
  const [history, setHistory] = useState<EntryResult[]>([]);
  const [rm, setRm] = useState('');
  const verifyingRef = useRef(false);

  const showEntry = (entry: EntryResult) => {
    setCurrent(entry);
    setHistory((items) => [entry, ...items].slice(0, 8));
  };

  useEffect(
    () =>
      serial.subscribe(async (event) => {
        if (event.type !== 'found' || !verifyingRef.current) return;
        try {
          showEntry(await accessLogsApi.registerFingerprint(event.slot));
        } catch (err) {
          toast.error(errorMessage(err));
        }
      }),
    [serial, toast],
  );

  // Ao sair da tela, para a verificação no Arduino (como o FormClosing do legado).
  useEffect(
    () => () => {
      if (verifyingRef.current) void serial.send(SerialCommands.stop).catch(() => undefined);
    },
    [serial],
  );

  useEffect(() => {
    if (!serial.connected) {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }, [serial.connected]);

  async function toggleVerification() {
    try {
      const next = !verifying;
      await serial.send(next ? SerialCommands.verify : SerialCommands.stop);
      verifyingRef.current = next;
      setVerifying(next);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function handleManual(event: FormEvent) {
    event.preventDefault();
    if (!rm.trim()) return;
    try {
      showEntry(await accessLogsApi.registerManual(rm.trim()));
      setRm('');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const student = current?.student;

  return (
    <>
      <PageHeader title="Verificação" description="Leia a digital do aluno para registrar a entrada." />

      <div className="verify-layout">
        <section className="card verify-card">
          <div className={`scanner ${verifying ? 'active' : ''}`}>
            <FingerprintIcon width={72} height={72} />
          </div>
          <p className="scanner-status" aria-live="polite">
            {!serial.connected ? 'Arduino desconectado' : verifying ? 'Aguardando digital...' : 'Pronto para verificar'}
          </p>
          <div className="progress" aria-hidden>
            <div className={`progress-bar ${verifying ? 'indeterminate' : ''}`} />
          </div>
          {serial.connected ? (
            <button type="button" className="btn btn-primary btn-block" onClick={toggleVerification}>
              {verifying ? 'Parar' : 'Verificar'}
            </button>
          ) : (
            <Link to="/configuracoes" className="btn btn-primary btn-block">
              Conectar Arduino
            </Link>
          )}

          <form className="manual-entry" onSubmit={handleManual}>
            <label className="field">
              <span>Entrada manual pelo RM</span>
              <div className="inline-input">
                <input value={rm} onChange={(event) => setRm(event.target.value)} maxLength={8} placeholder="RM do aluno" />
                <button type="submit" className="btn btn-outline" disabled={!rm.trim()}>
                  Registrar
                </button>
              </div>
            </label>
          </form>
        </section>

        <section className="card student-card" aria-live="polite">
          {student ? (
            <>
              <StudentPhoto studentId={student.id} hasPhoto={student.hasPhoto} alt={student.name} className="xlarge" />
              <dl className="student-info">
                <div>
                  <dt>Nome</dt>
                  <dd>{student.name}</dd>
                </div>
                <div>
                  <dt>RM</dt>
                  <dd>{student.rm}</dd>
                </div>
                <div>
                  <dt>Série</dt>
                  <dd>{yearLabel(student.year)}</dd>
                </div>
                <div>
                  <dt>Curso</dt>
                  <dd>{student.course.name}</dd>
                </div>
                <div>
                  <dt>Entrada</dt>
                  <dd>{formatTime(current.log.createdAt)}</dd>
                </div>
              </dl>
              <span className="badge badge-success">Acesso liberado</span>
            </>
          ) : (
            <p className="muted empty">Nenhuma entrada registrada nesta sessão.</p>
          )}
        </section>
      </div>

      {history.length > 0 && (
        <section className="card">
          <h2 className="card-title">Últimas entradas</h2>
          <ul className="entry-list">
            {history.map((entry) => (
              <li key={entry.log.id}>
                <span>{entry.student.name}</span>
                <span className="muted">
                  {entry.log.method === 'MANUAL' ? 'Manual · ' : ''}
                  {formatTime(entry.log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
