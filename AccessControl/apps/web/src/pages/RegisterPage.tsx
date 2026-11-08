import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { validatePasswordPair } from '../utils/validation';

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { loadUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirm) {
      setError('Todos os campos devem ser preenchidos corretamente!');
      return;
    }
    const passwordError = validatePasswordPair(form.password, form.confirm);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { message, needsVerification } = await authApi.register(form.name.trim(), form.email.trim(), form.password);
      if (needsVerification) {
        toast.info(message);
        navigate(`/ativar-conta?email=${encodeURIComponent(form.email.trim())}`);
      } else {
        // Projeto sem confirmação de e-mail: o Supabase já abre a sessão.
        await loadUser();
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
      setForm((current) => ({ ...current, password: '', confirm: '' }));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Cadastro" subtitle="Cadastre sua instituição para começar a controlar os acessos." backTo="/login">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Nome completo da instituição</span>
          <input autoComplete="organization" value={form.name} onChange={update('name')} maxLength={100} required />
        </label>
        <label className="field">
          <span>E-mail</span>
          <input type="email" autoComplete="email" value={form.email} onChange={update('email')} required />
        </label>
        <label className="field">
          <span>Senha</span>
          <PasswordInput autoComplete="new-password" value={form.password} onChange={update('password')} required />
          <small className="hint">Mínimo de 9 caracteres</small>
        </label>
        <label className="field">
          <span>Confirmar senha</span>
          <PasswordInput autoComplete="new-password" value={form.confirm} onChange={update('confirm')} required />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Enviando código...' : 'Cadastrar'}
        </button>
      </form>
    </AuthLayout>
  );
}
