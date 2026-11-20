import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { statsApi } from '../api';
import { AttendanceAlerts } from '../components/AttendanceAlerts';
import { errorMessage } from '../api/client';
import type { Stats } from '../api/types';
import { FingerprintIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { displayName, useAuth } from '../contexts/AuthContext';
import { useSchoolScope } from '../contexts/SchoolScopeContext';
import { useSerial } from '../contexts/SerialContext';
import { useToast } from '../contexts/ToastContext';
import { firstName, formatTime } from '../utils/format';

const todayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

const SHORTCUTS = [
  { to: '/alunos', label: 'Cadastrar aluno', description: 'Foto, dados e digital' },
  { to: '/cursos', label: 'Gerenciar cursos', description: 'Cursos oferecidos pela escola' },
  { to: '/entradas', label: 'Relatório de entradas', description: 'Filtrar e exportar em CSV' },
];

/** Início: o cartão de ponto do dia, com cada leitura da catraca carimbada. */
export function DashboardPage() {
  const { selected, selectedName } = useSchoolScope();
  const allSchools = selected === 'all';
  const { user } = useAuth();
  const serial = useSerial();
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    statsApi.get().then(setStats).catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  const now = new Date();
  const startOfDay = new Date(now).setHours(0, 0, 0, 0);
  const todayEntries = stats?.recentEntries.filter((entry) => new Date(entry.createdAt).getTime() >= startOfDay) ?? [];
  const schoolName = selectedName || user?.school?.name || '';

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName(displayName(user))}!`}
        description={todayFormatter.format(now)}
        actions={
          <Link to="/verificacao" className="btn btn-primary">
            <FingerprintIcon />
            Abrir Verificação
          </Link>
        }
      />

      <div className="dash-grid">
        <section className="timecard" aria-labelledby="timecard-title">
          <header className="timecard-head">
            <div>
              <h2 id="timecard-title">Cartão do dia</h2>
              <p>
                {schoolName} · {todayFormatter.format(now)}
              </p>
            </div>
            <Link to="/configuracoes" className={`reader-chip ${serial.connected ? 'on' : 'off'}`}>
              <span className={`status-dot ${serial.connected ? 'on' : 'off'}`} />
              {serial.connected ? 'Leitor conectado' : 'Leitor desconectado'}
            </Link>
          </header>

          <table className="timecard-table">
            <thead>
              <tr>
                <th scope="col">Aluno</th>
                {allSchools && <th scope="col">Escola</th>}
                <th scope="col" className="timecard-course">
                  Curso
                </th>
                <th scope="col" className="timecard-time">
                  Horário
                </th>
              </tr>
            </thead>
            <tbody>
              {stats && todayEntries.length === 0 && (
                <tr>
                  <td colSpan={allSchools ? 4 : 3} className="empty">
                    Nenhuma leitura hoje. Quando a catraca ler uma digital, o horário aparece carimbado aqui.
                  </td>
                </tr>
              )}
              {todayEntries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="timecard-name">
                    {entry.studentName}
                    {/* Leitura manual é exceção (leitor indisponível): marcada em tinta vermelha. */}
                    {entry.method === 'MANUAL' && <span className="ink-tag">Manual</span>}
                  </td>
                  {allSchools && <td className="muted">{entry.school?.name}</td>}
                  <td className="muted timecard-course">{entry.student?.course?.name ?? '—'}</td>
                  <td className="timecard-time">
                    {/* A leitura mais recente leva o carimbo emoldurado, como na Verificação. */}
                    <time dateTime={entry.createdAt} className={`stamp ${index === 0 ? 'stamp-box' : ''}`}>
                      {formatTime(entry.createdAt)}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <footer className="timecard-foot">
            <span>
              <strong>{stats?.entriesToday ?? '–'}</strong> leituras hoje
            </span>
            <span>
              <strong>{stats?.students ?? '–'}</strong> alunos
            </span>
            <Link to="/entradas">Ver todas as entradas</Link>
          </footer>
        </section>

        <aside className="dash-side">
          {/* Só com uma escola em uso: a frequência é calculada por escola. */}
          {!allSchools && selected !== null && <AttendanceAlerts />}
          <section className="card">
            <h2 className="card-title">Pendências</h2>
            <Link to="/alunos" className="pending">
              <strong>{stats?.pendingFingerprints ?? '–'}</strong>
              <span>
                {stats?.pendingFingerprints === 1 ? 'aluno sem digital cadastrada' : 'alunos sem digital cadastrada'}
              </span>
            </Link>
            {!serial.connected && (
              <Link to="/configuracoes" className="pending">
                <FingerprintIcon />
                <span>Conecte o leitor para registrar entradas</span>
              </Link>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">Atalhos</h2>
            <ul className="shortcut-list">
              {SHORTCUTS.map(({ to, label, description }) => (
                <li key={label}>
                  <Link to={to} className="shortcut">
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
