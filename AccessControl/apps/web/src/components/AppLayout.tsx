import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSerial } from '../contexts/SerialContext';
import { firstName } from '../utils/format';
import {
  BookIcon,
  FingerprintIcon,
  HomeIcon,
  ListIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  StudentIcon,
  UserIcon,
} from './Icons';
import { Logo } from './Logo';

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/alunos', label: 'Alunos', icon: StudentIcon },
  { to: '/cursos', label: 'Cursos', icon: BookIcon },
  { to: '/verificacao', label: 'Verificação', icon: FingerprintIcon },
  { to: '/entradas', label: 'Entradas', icon: ListIcon },
  { to: '/configuracoes', label: 'Configurações', icon: SettingsIcon },
];

/** Menu lateral escuro (#2C2C2C) do frmMainMenu legado. */
export function AppLayout() {
  const { school, logout } = useAuth();
  const { connected } = useSerial();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
      <header className="mobile-topbar">
        <button type="button" className="icon-button" aria-label="Abrir menu" onClick={() => setMenuOpen((open) => !open)}>
          <MenuIcon />
        </button>
        <Logo variant="light" className="mobile-logo" />
      </header>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo variant="light" className="sidebar-logo" />
        </div>
        <div className="sidebar-user">
          <span className="avatar">
            <UserIcon />
          </span>
          <div>
            <small>Bem-vindo(a)</small>
            <strong title={school?.name}>{firstName(school?.name ?? '')}</strong>
          </div>
        </div>
        <nav className="sidebar-nav" onClick={() => setMenuOpen(false)}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-item">
              <Icon />
              <span>{label}</span>
              {to === '/configuracoes' && (
                <span className={`status-dot ${connected ? 'on' : 'off'}`} title={connected ? 'Arduino conectado' : 'Arduino desconectado'} />
              )}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="nav-item logout" onClick={handleLogout}>
          <LogoutIcon />
          <span>Sair</span>
        </button>
      </aside>

      <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
