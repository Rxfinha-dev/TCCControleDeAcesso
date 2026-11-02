import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { statsApi } from '../api';
import { errorMessage } from '../api/client';
import type { Stats } from '../api/types';
import { BookIcon, FingerprintIcon, ListIcon, StudentIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useSerial } from '../contexts/SerialContext';
import { useToast } from '../contexts/ToastContext';
import { firstName, formatTime } from '../utils/format';

export function DashboardPage() {
  const { school } = useAuth();
  const serial = useSerial();
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    statsApi.get().then(setStats).catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  const cards = [
    { label: 'Alunos', value: stats?.students, to: '/alunos', icon: StudentIcon },
    { label: 'Cursos', value: stats?.courses, to: '/cursos', icon: BookIcon },
    { label: 'Entradas hoje', value: stats?.entriesToday, to: '/entradas', icon: ListIcon },
    { label: 'Digitais pendentes', value: stats?.pendingFingerprints, to: '/alunos', icon: FingerprintIcon },
  ];

  return (
    <>
      <PageHeader title={`Olá, ${firstName(school?.name ?? '')}!`} description="Resumo do controle de acesso da sua instituição." />

      {!serial.connected && (
        <div className="banner">
          O leitor biométrico não está conectado. <Link to="/configuracoes">Conectar Arduino</Link>
        </div>
      )}

      <div className="stats-grid">
        {cards.map(({ label, value, to, icon: Icon }) => (
          <Link key={label} to={to} className="card stat-card">
            <Icon width={28} height={28} />
            <strong>{value ?? '–'}</strong>
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className="split-layout even">
        <section className="card">
          <h2 className="card-title">Últimas entradas</h2>
          {stats && stats.recentEntries.length === 0 && <p className="muted">Nenhuma entrada registrada ainda.</p>}
          <ul className="entry-list">
            {stats?.recentEntries.map((entry) => (
              <li key={entry.id}>
                <span>{entry.studentName}</span>
                <span className="muted">{formatTime(entry.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card quick-actions">
          <h2 className="card-title">Ações rápidas</h2>
          <Link to="/verificacao" className="btn btn-primary btn-block">
            Iniciar verificação
          </Link>
          <Link to="/alunos" className="btn btn-outline btn-block">
            Cadastrar aluno
          </Link>
          <Link to="/entradas" className="btn btn-outline btn-block">
            Ver relatório de entradas
          </Link>
        </section>
      </div>
    </>
  );
}
