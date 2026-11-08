import { useState } from 'react';
import { errorMessage } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
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
