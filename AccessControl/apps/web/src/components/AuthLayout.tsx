import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeftIcon } from './Icons';
import { Logo } from './Logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  children: ReactNode;
}

/**
 * Layout das telas públicas: a "bolha" azul com a logo flutuando à esquerda
 * e o cartão com borda azul à direita (identidade visual do frmLogin legado).
 */
export function AuthLayout({ title, subtitle, backTo, children }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <aside className="auth-hero">
        <Logo className="auth-logo floating" />
        <p className="auth-tagline">Segurança que conecta</p>
      </aside>
      <main className="auth-content">
        <section className="auth-card">
          {backTo && (
            <Link to={backTo} className="icon-button auth-back" aria-label="Voltar">
              <ArrowLeftIcon />
            </Link>
          )}
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
        </section>
      </main>
    </div>
  );
}
