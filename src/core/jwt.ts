import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from './env.js';
import { UnauthorizedError } from './errors.js';

export type Rol = 'pasajero' | 'conductor' | 'propietario' | 'admin';

// fase 1: `rol` (principal, derivado) viaja junto a `roles` por compatibilidad.
export interface AccessPayload { sub: number; rol: Rol; roles: Rol[]; type: 'access'; }
export interface RefreshPayload { sub: number; sid: number; type: 'refresh'; }
export interface RegistrationPayload { correo: string; rol: Rol; type: 'registration'; }

// `roles` opcional: tokens emitidos antes del deploy solo traen `rol`.
export type AuthTokenPayload = { sub: number; rol: Rol; roles?: Rol[] };

function sign(payload: object, ttl: string): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ttl as SignOptions['expiresIn'] });
}

function verify<T extends { type: string }>(token: string, type: T['type']): T {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || typeof decoded !== 'object' || (decoded as { type?: string }).type !== type) {
      throw new Error('tipo de token invalido');
    }
    return decoded as unknown as T;
  } catch {
    throw new UnauthorizedError('Token invalido o expirado');
  }
}

const PRIORIDAD_ROL: Rol[] = ['admin', 'propietario', 'conductor', 'pasajero'];
export function rolPrincipal(roles: Rol[]): Rol {
  return PRIORIDAD_ROL.find((r) => roles.includes(r)) ?? 'pasajero';
}

export const signAccessToken = (p: { sub: number; roles: Rol[] }): string =>
  sign({ sub: p.sub, rol: rolPrincipal(p.roles), roles: p.roles, type: 'access' }, env.ACCESS_TOKEN_TTL);
export const verifyAccessToken = (t: string): AccessPayload => verify<AccessPayload>(t, 'access');

export const signRefreshToken = (p: { sub: number; sid: number }): string =>
  sign({ ...p, type: 'refresh' }, env.REFRESH_TOKEN_TTL);
export const verifyRefreshToken = (t: string): RefreshPayload => verify<RefreshPayload>(t, 'refresh');

export const signRegistrationToken = (p: { correo: string; rol: Rol }): string =>
  sign({ ...p, type: 'registration' }, env.REGISTRATION_TOKEN_TTL);
export const verifyRegistrationToken = (t: string): RegistrationPayload =>
  verify<RegistrationPayload>(t, 'registration');
