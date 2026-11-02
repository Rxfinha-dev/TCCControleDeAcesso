import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { onlyDigits } from '../utils/validation';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { startSession } = useAuth();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { message, ...session } = await authApi.verifyEmail(email, code);
      startSession(session);
      toast.success(message);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError('Informe o e-mail cadastrado');
      return;
    }
    setResending(true);
    try {
      const { message } = await authApi.resendVerification(email);
      toast.info(message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Ativação da conta"
      subtitle="Insira o código enviado ao seu e-mail para ativar sua conta."
      backTo="/cadastro"
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>E-mail</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="field">
          <span>Código de ativação</span>
          <input
            className="code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(onlyDigits(event.target.value))}
            required
          />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting || code.length !== 6 || !email}>
          {submitting ? 'Ativando...' : 'Ativar conta'}
        </button>
      </form>
      <p className="auth-footer">
        Problemas para receber o seu e-mail? Lembre-se de verificar a caixa de spam e a lixeira.{' '}
        <button type="button" className="link-button" onClick={handleResend} disabled={resending}>
          {resending ? 'Reenviando...' : 'Reenviar código'}
        </button>
      </p>
    </AuthLayout>
  );
}
