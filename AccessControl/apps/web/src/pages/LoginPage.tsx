import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { ApiError, errorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function LoginPage() {
  const { school, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (school) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        toast.info(err.message);
        navigate(`/ativar-conta?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(errorMessage(err));
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Acesse o painel de controle de acesso da sua instituição.">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Usuário</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Senha</span>
          <PasswordInput
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email || !password}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
        <Link to="/esqueci-senha" className="btn btn-outline btn-block">
          Esqueci minha senha
        </Link>
      </form>
      <p className="auth-footer">
        Ainda não é usuário? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </AuthLayout>
  );
}
