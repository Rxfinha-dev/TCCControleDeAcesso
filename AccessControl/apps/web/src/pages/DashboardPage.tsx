import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { statsApi } from '../api';
import { errorMessage } from '../api/client';
import type { Stats } from '../api/types';
import { BookIcon, FingerprintIcon, ListIcon, StudentIcon } from '../components/Icons';
import { NetworkMotif } from '../components/NetworkMotif';
import { PageHeader } from '../components/PageHeader';
import { displayName, useAuth } from '../contexts/AuthContext';
import { useSerial } from '../contexts/SerialContext';
import { useToast } from '../contexts/ToastContext';
import { firstName, formatTime, initials } from '../utils/format';

const todayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

const SHORTCUTS = [
  { to: '/alunos', label: 'Cadastrar aluno', description: 'Foto, dados e digital', icon: StudentIcon },
  { to: '/cursos', label: 'Gerenciar cursos', description: 'Cursos oferecidos pela escola', icon: BookIcon },
  { to: '/entradas', label: 'Relatório de entradas', description: 'Filtrar e exportar em CSV', icon: ListIcon },
];

export function DashboardPage() {
  const { user } = useAuth();
  const serial = useSerial();
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    statsApi.get().then(setStats).catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  const metrics = [
    { label: 'Alunos', value: stats?.students, to: '/alunos' },
    { label: 'Cursos', value: stats?.courses, to: '/cursos' },
    { label: 'Digitais pendentes', value: stats?.pendingFingerprints, to: '/alunos' },
  ];

  return (
    <>
      <PageHeader title={`Olá, ${firstName(displayName(user))}!`} description={todayFormatter.format(new Date())} />

      {!serial.connected && (
        <div className="banner">
          <FingerprintIcon />
          <span>O leitor biométrico não está conectado.</span>
          <Link to="/configuracoes">Conectar Arduino</Link>
        </div>
      )}

      <section className="today-panel" aria-labelledby="today-title">
        <NetworkMotif className="today-motif" />
        <div className="today-main">
          <span id="today-title">Entradas hoje</span>
          <strong className="today-number">{stats?.entriesToday ?? '–'}</strong>
          <Link to="/verificacao" className="btn btn-ink">
            <FingerprintIcon />
            Iniciar verificação
          </Link>
        </div>
        <ul className="today-metrics">
          {metrics.map(({ label, value, to }) => (
            <li key={label}>
              <Link to={to}>
                <strong>{value ?? '–'}</strong>
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="dash-grid">
        <section className="card">
          <header className="card-header">
            <h2 className="card-title">Últimas entradas</h2>
            <Link to="/entradas">Ver todas</Link>
          </header>
          {stats && stats.recentEntries.length === 0 && (
            <p className="empty">Nenhuma entrada registrada ainda. As leituras da tela de Verificação aparecem aqui.</p>
          )}
          <ul className="entry-list">
            {stats?.recentEntries.map((entry) => (
              <li key={entry.id}>
                <span className="avatar avatar-soft" aria-hidden>
                  {initials(entry.studentName)}
                </span>
                <span className="entry-name">{entry.studentName}</span>
                {entry.method === 'MANUAL' && <span className="badge badge-muted">Manual</span>}
                <time dateTime={entry.createdAt}>{formatTime(entry.createdAt)}</time>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="card-title">Atalhos</h2>
          <ul className="shortcut-list">
            {SHORTCUTS.map(({ to, label, description, icon: Icon }) => (
              <li key={label}>
                <Link to={to} className="shortcut">
                  <span className="shortcut-icon">
                    <Icon />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
