import { useEffect, useState, type FormEvent } from 'react';
import { settingsApi } from '../api';
import { errorMessage } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useSchoolScope } from '../contexts/SchoolScopeContext';
import { useSerial } from '../contexts/SerialContext';
import { useToast } from '../contexts/ToastContext';

const BAUD_RATES = [9600, 19200, 57600, 115200];
const BAUD_KEY = 'helpus.baudRate';

/** Configurações (frmConfiguracoes): conexão com o Arduino agora via Web Serial. */
export function SettingsPage() {
  const serial = useSerial();
  const toast = useToast();
  const { user } = useAuth();
  const [baudRate, setBaudRate] = useState(() => Number(localStorage.getItem(BAUD_KEY)) || 9600);
  const [busy, setBusy] = useState(false);
  const { selected } = useSchoolScope();
  const hasSchool = selected !== 'all';
  const [minAttendance, setMinAttendance] = useState('');
  const [savingMin, setSavingMin] = useState(false);
  const [code, setCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);

  useEffect(() => {
    if (!hasSchool) return;
    settingsApi
      .get()
      .then((settings) => {
        setMinAttendance(String(settings.minAttendance));
        setCode(settings.code ?? '');
      })
      .catch((err) => toast.error(errorMessage(err)));
  }, [hasSchool, selected, toast]);

  async function saveCode(event: FormEvent) {
    event.preventDefault();
    setSavingCode(true);
    try {
      const saved = await settingsApi.save({ code });
      setCode(saved.code ?? '');
      toast.success('Código da escola salvo.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingCode(false);
    }
  }

  async function saveMinAttendance(event: FormEvent) {
    event.preventDefault();
    const value = Number(minAttendance);
    if (minAttendance === '' || !Number.isInteger(value) || value < 0 || value > 100) {
      toast.error('Informe um número inteiro de 0 a 100');
      return;
    }
    setSavingMin(true);
    try {
      await settingsApi.save({ minAttendance: value });
      toast.success('Frequência mínima salva.');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingMin(false);
    }
  }

  async function toggleConnection() {
    setBusy(true);
    try {
      if (serial.connected) {
        await serial.disconnect();
        toast.info('Arduino desconectado.');
      } else {
        localStorage.setItem(BAUD_KEY, String(baudRate));
        await serial.connect(baudRate);
        toast.success('Arduino conectado!');
      }
    } catch (err) {
      // Fechar o seletor de portas sem escolher não é um erro.
      if (err instanceof DOMException && err.name === 'NotFoundError') return;
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Configurações" description="Conexão com o leitor biométrico e dados da conta." />

      <div className="settings-grid">
        <section className="card form">
          <h2 className="card-title">Conexão com o Arduino</h2>
          {!serial.supported ? (
            <p className="form-error">
              Seu navegador não suporta a conexão com o Arduino (Web Serial). Use o Google Chrome ou o Microsoft Edge no
              computador.
            </p>
          ) : (
            <>
              <label className="field">
                <span>Velocidade (baud rate)</span>
                <select value={baudRate} disabled={serial.connected} onChange={(event) => setBaudRate(Number(event.target.value))}>
                  {BAUD_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}
                    </option>
                  ))}
                </select>
              </label>
              <div className={`connection-state ${serial.connected ? 'on' : 'off'}`}>
                <span className={`status-dot ${serial.connected ? 'on' : 'off'}`} />
                <div>
                  <strong>{serial.connected ? 'Conectado' : 'Desconectado'}</strong>
                  <small>
                    {serial.connected
                      ? serial.portLabel
                        ? `Porta ${serial.portLabel}`
                        : 'Leitor pronto para uso'
                      : 'Nenhum dispositivo conectado.'}
                  </small>
                </div>
              </div>
              <button type="button" className="btn btn-primary" onClick={toggleConnection} disabled={busy}>
                {serial.connected ? 'Desconectar' : 'Conectar'}
              </button>
              <p className="hint">
                Ao clicar em Conectar, o navegador mostrará a lista de portas. Selecione a porta do Arduino (ex.: USB-SERIAL CH340).
              </p>
            </>
          )}
        </section>

        {hasSchool && (
          <form className="card form" onSubmit={saveMinAttendance} noValidate>
            <h2 className="card-title">Frequência</h2>
            <label className="field">
              <span>Frequência mínima (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={minAttendance}
                onChange={(event) => setMinAttendance(event.target.value)}
              />
            </label>
            <p className="hint">
              Abaixo disso o aluno aparece em vermelho na Presença. O padrão da LDB é 75%.
            </p>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingMin}>
                Salvar frequência mínima
              </button>
            </div>
          </form>
        )}

        {hasSchool && (
          <form className="card form" onSubmit={saveCode} noValidate>
            <h2 className="card-title">Logins de professores e alunos</h2>
            <label className="field">
              <span>Código da escola</span>
              <input value={code} onChange={(event) => setCode(event.target.value)} maxLength={30} placeholder="ex.: etec-jau" />
            </label>
            <p className="hint">
              Os usuários ficam como <span className="mono">nome.sobrenome@{code || 'código'}</span> (professor) e{' '}
              <span className="mono">RM@{code || 'código'}</span> (aluno). Use letras, números e hífen. Depois de criar logins, o
              código não muda mais.
            </p>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={savingCode || !code.trim()}>
                Salvar código
              </button>
            </div>
          </form>
        )}

        <section className="card">
          <h2 className="card-title">Conta</h2>
          <dl className="student-info">
            <div>
              <dt>Instituição</dt>
              <dd>{user?.school?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>{user?.email}</dd>
            </div>
          </dl>
          <p className="hint">Para trocar a senha, saia e use a opção “Esqueci minha senha”.</p>
        </section>
      </div>
    </>
  );
}
