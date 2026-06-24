import { randomBytes, createHash } from 'node:crypto';

/** Token en claro (sólo viaja por email). 32 bytes → base64url. */
export const generarToken = (): string => randomBytes(32).toString('base64url');

/** sha256 hex del token: lo que se guarda y se consulta en BD (64 chars). */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
