import { randomInt } from 'node:crypto';
import { z } from 'zod';

/**
 * Logins de professor/aluno: o usuário é "joao.silva@etec-jau" e o Supabase Auth recebe um e-mail
 * sintético "joao.silva@etec-jau.helpus.invalid" (".invalid" é reservado: nunca recebe e-mail).
 * O frontend faz a mesma tradução na tela de login.
 */
export const LOGIN_EMAIL_SUFFIX = '.helpus.invalid';

export const loginEmail = (username: string) => `${username}${LOGIN_EMAIL_SUFFIX}`;
export const isLoginEmail = (email: string) => email.toLowerCase().endsWith(LOGIN_EMAIL_SUFFIX);

/** Código curto da escola: letras minúsculas, números e hífen (sem ponto, para o login não virar e-mail real). */
export const schoolCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, 'O código precisa de pelo menos 2 caracteres')
  .max(30, 'O código pode ter até 30 caracteres')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use só letras, números e hífen (ex.: etec-jau)');

export const passwordSchema = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres')
  .max(72, 'A senha pode ter até 72 caracteres');

/** "João da Silva" -> "joao.silva": primeiro e último nome, sem acentos. */
export function usernameBase(name: string) {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return 'professor';
  return words.length === 1 ? words[0] : `${words[0]}.${words.at(-1)}`;
}

// Sem 0/O, 1/l/I: a senha é lida numa lista impressa.
const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Senha inicial aleatória (8 caracteres, com pelo menos um número). */
export function randomPassword() {
  for (;;) {
    const password = Array.from({ length: 8 }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join('');
    if (/\d/.test(password) && /[a-z]/.test(password)) return password;
  }
}
