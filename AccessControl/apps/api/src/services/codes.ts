import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';

export const CODE_TTL_MINUTES = 15;
export const CODE_MAX_ATTEMPTS = 5;

/** Gera um código numérico de 6 dígitos com gerador criptograficamente seguro. */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashCode(code: string): string {
  return createHmac('sha256', env.JWT_SECRET).update(code).digest('hex');
}

export function compareCode(code: string, hash: string): boolean {
  const a = Buffer.from(hashCode(code), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function codeExpiration(from = new Date()): Date {
  return new Date(from.getTime() + CODE_TTL_MINUTES * 60_000);
}
