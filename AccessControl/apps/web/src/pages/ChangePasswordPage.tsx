import { useState, type FormEvent } from 'react';
import { authApi } from '../api';
import { errorMessage } from '../api/client';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { firstName } from '../utils/format';

/** Primeiro acesso de professor e aluno (ou depois de a escola gerar uma nova senha): troca obrigatória. */
export function ChangePasswordPage() {
  const { user, loadUser, logout } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('A senha precisa de pelo menos 8 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('As duas senhas não são iguais');
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(password);
      toast.success('Senha criada! Use a nova senha nos próximos acessos.');
      await loadUser();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <AuthLayout
      title="Crie sua senha"
      subtitle={`Olá, ${firstName(user?.name ?? '')}! Antes de começar, troque a senha inicial que a escola entregou.`}
    >
      <form className="form" onSubmit={handleSubmit} noValidate>
        {user?.username && (
          <p className="hint">
            Seu usuário: <strong className="mono">{user.username}</strong>
          </p>
        )}
        <label className="field">
          <span>Nova senha</span>
          <PasswordInput
            autoComplete="new-password"
            placeholder="Pelo menos 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Repita a nova senha</span>
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={saving || !password || !confirm}>
          {saving ? 'Salvando...' : 'Salvar senha'}
        </button>
        <button type="button" className="btn btn-outline btn-block" onClick={() => void logout()}>
          Sair
        </button>
      </form>
    </AuthLayout>
  );
}
