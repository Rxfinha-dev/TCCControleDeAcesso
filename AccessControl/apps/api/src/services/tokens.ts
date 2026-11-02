import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

const ALGORITHM = 'HS256';

export interface AuthTokenPayload {
  sub: number;
  name: string;
  email: string;
  /** Versão da sessão da instituição no momento do login (ver School.sessionVersion). */
  ver: number;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign({ name: payload.name, email: payload.email, ver: payload.ver }, env.JWT_SECRET, {
    subject: String(payload.sub),
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] }) as jwt.JwtPayload;
  return { sub: Number(decoded.sub), name: decoded.name, email: decoded.email, ver: Number(decoded.ver ?? 0) };
}
