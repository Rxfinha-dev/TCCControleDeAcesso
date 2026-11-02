import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { useToast } from '../contexts/ToastContext';
import { onlyDigits, validatePasswordPair } from '../utils/validation';

/** Fluxo de "Esqueci minha senha": envio do código (frmNovaSenha) + nova senha (frmTrocandoSenha). */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { message } = await authApi.forgotPassword(email);
      toast.info(message);
      setStep('reset');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    const passwordError = validatePasswordPair(password, confirm);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { message } = await authApi.resetPassword(email, code, password);
      toast.success(message);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setCode('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle={
        step === 'email'
          ? 'Digite seu e-mail para receber um código de verificação.'
          : `Digite o código enviado para ${email} e escolha a nova senha.`
      }
      backTo="/login"
    >
      {step === 'email' ? (
        <form className="form" onSubmit={sendCode} noValidate>
          <label className="field">
            <span>Digite seu e-mail</span>
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !email}>
            {submitting ? 'Enviando...' : 'Enviar e-mail'}
          </button>
        </form>
      ) : (
        <form className="form" onSubmit={resetPassword} noValidate>
          <label className="field">
            <span>Código de verificação</span>
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
          <label className="field">
            <span>Nova senha</span>
            <PasswordInput autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="field">
            <span>Repetir a nova senha</span>
            <PasswordInput autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || code.length !== 6}>
            {submitting ? 'Alterando...' : 'Alterar senha'}
          </button>
          <button type="button" className="link-button" onClick={() => sendCode()} disabled={submitting}>
            Reenviar código
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
