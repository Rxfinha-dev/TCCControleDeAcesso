import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { accessLogsApi } from '../api';
import { errorMessage } from '../api/client';
import type { EntryResult } from '../api/types';
import { CheckIcon, FingerprintIcon } from '../components/Icons';
import { NetworkMotif } from '../components/NetworkMotif';
import { PageHeader } from '../components/PageHeader';
import { StudentPhoto } from '../components/StudentPhoto';
import { useSerial } from '../contexts/SerialContext';
import { useToast } from '../contexts/ToastContext';
import { SerialCommands } from '../serial/protocol';
import { formatTime, initials, yearLabel } from '../utils/format';

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
  const status = !serial.connected ? 'Leitor desconectado' : verifying ? 'Aguardando digital...' : 'Pronto para verificar';

  return (
    <>
      <PageHeader title="Verificação" description="Leia a digital do aluno para registrar a entrada." />

      <div className="verify-layout">
        <section className="card verify-card">
          <div className={`scanner ${verifying ? 'active' : ''} ${serial.connected ? '' : 'offline'}`}>
            <FingerprintIcon width={84} height={84} strokeWidth={1.4} />
          </div>
          <p className="scanner-status" aria-live="polite">
            {status}
          </p>
          <p className="muted scanner-hint">
            {!serial.connected
              ? 'Conecte o Arduino para começar a ler digitais.'
              : verifying
                ? 'Peça ao aluno para posicionar o dedo no sensor.'
                : 'Inicie a leitura para registrar as entradas.'}
          </p>
          {serial.connected ? (
            <button type="button" className={`btn btn-block ${verifying ? 'btn-outline' : 'btn-primary'}`} onClick={toggleVerification}>
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
                <input value={rm} onChange={(event) => setRm(event.target.value)} maxLength={8} placeholder="RM do aluno" inputMode="numeric" />
                <button type="submit" className="btn btn-outline" disabled={!rm.trim()}>
                  Registrar
                </button>
              </div>
            </label>
          </form>
        </section>

        <section className={`result-panel ${student ? 'granted' : ''}`} aria-live="polite">
          {student ? (
            <article key={current.log.id} className="result">
              <header className="result-band">
                <span className="result-check">
                  <CheckIcon width={26} height={26} strokeWidth={2.6} />
                </span>
                <strong>Acesso liberado</strong>
                <time dateTime={current.log.createdAt}>{formatTime(current.log.createdAt)}</time>
              </header>
              <div className="result-body">
                <StudentPhoto studentId={student.id} hasPhoto={student.hasPhoto} alt={student.name} className="xlarge" />
                <div className="result-details">
                  <h2>{student.name}</h2>
                  <dl className="student-info">
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
                      <dt>Registro</dt>
                      <dd>{current.log.method === 'MANUAL' ? 'Manual, pelo RM' : 'Digital'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </article>
          ) : (
            <div className="result-empty">
              <NetworkMotif className="result-motif" />
              <h2>Nenhuma entrada nesta sessão</h2>
              <p className="muted">Quando uma digital for reconhecida, a foto e os dados do aluno aparecem aqui.</p>
            </div>
          )}
        </section>
      </div>

      {history.length > 0 && (
        <section className="card">
          <h2 className="card-title">Entradas desta sessão</h2>
          <ul className="entry-list">
            {history.map((entry) => (
              <li key={entry.log.id}>
                <span className="avatar avatar-soft" aria-hidden>
                  {initials(entry.student.name)}
                </span>
                <span className="entry-name">{entry.student.name}</span>
                {entry.log.method === 'MANUAL' && <span className="badge badge-muted">Manual</span>}
                <time dateTime={entry.log.createdAt}>{formatTime(entry.log.createdAt)}</time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
