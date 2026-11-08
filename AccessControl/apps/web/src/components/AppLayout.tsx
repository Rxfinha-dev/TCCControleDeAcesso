import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { displayName, useAuth } from '../contexts/AuthContext';
import { useSerial } from '../contexts/SerialContext';
import { firstName, initials } from '../utils/format';
import {
  BookIcon,
  FingerprintIcon,
  HomeIcon,
  ListIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  StudentIcon,
} from './Icons';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

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
  const { user, logout } = useAuth();
  const name = displayName(user);
  const { connected } = useSerial();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    void logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
      <header className="mobile-topbar">
        <button type="button" className="icon-button" aria-label="Abrir menu" onClick={() => setMenuOpen((open) => !open)}>
          <MenuIcon />
        </button>
        <Logo variant="light" className="mobile-logo" />
        <ThemeToggle />
        <span className={`status-dot ${connected ? 'on' : 'off'}`} title={connected ? 'Leitor conectado' : 'Leitor desconectado'} />
      </header>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo variant="light" className="sidebar-logo" />
          <ThemeToggle />
        </div>
        <nav className="sidebar-nav" onClick={() => setMenuOpen(false)}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-item">
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <Link to="/configuracoes" className={`reader-status ${connected ? 'on' : 'off'}`} onClick={() => setMenuOpen(false)}>
          <span className={`status-dot ${connected ? 'on' : 'off'}`} />
          <span>
            <strong>{connected ? 'Leitor conectado' : 'Leitor desconectado'}</strong>
            <small>{connected ? 'Pronto para ler digitais' : 'Conecte o Arduino'}</small>
          </span>
        </Link>

        <div className="sidebar-user">
          <span className="avatar" aria-hidden>
            {initials(name)}
          </span>
          <div>
            <small>Bem-vindo(a)</small>
            <strong title={name}>{firstName(name)}</strong>
          </div>
          <button type="button" className="icon-button logout" aria-label="Sair" title="Sair" onClick={handleLogout}>
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
