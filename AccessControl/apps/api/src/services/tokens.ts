import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthTokenPayload {
  sub: number;
  name: string;
  email: string;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign({ name: payload.name, email: payload.email }, env.JWT_SECRET, {
    subject: String(payload.sub),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  return { sub: Number(decoded.sub), name: decoded.name, email: decoded.email };
}
