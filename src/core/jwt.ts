import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from './env.js';
import { UnauthorizedError } from './errors.js';

export interface AuthTokenPayload {
  sub: number;
  rol: 'pasajero' | 'conductor' | 'propietario' | 'admin';
}

export function signToken(payload: AuthTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

export function verifyToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
      throw new Error('Payload invalido');
    }
    return decoded as AuthTokenPayload;
  } catch {
    throw new UnauthorizedError('Token invalido o expirado');
  }
}
