export const MIN_PASSWORD_LENGTH = 9;

/** Mesma regra do sistema legado: senhas iguais e com no mínimo 9 caracteres. */
export function validatePasswordPair(password: string, confirmation: string): string | null {
  if (password !== confirmation) return 'As senhas não coincidem';
  if (password.length < MIN_PASSWORD_LENGTH) return `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`;
  return null;
}

export const onlyDigits = (value: string, max = 6) => value.replace(/\D/g, '').slice(0, max);
