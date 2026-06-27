import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { env } from '../../core/env.js';

const DIGITS = 6;

export function generarCodigo(): string {
  return String(randomInt(0, 10 ** DIGITS)).padStart(DIGITS, '0');
}

export const hashCodigo = (codigo: string): Promise<string> => bcrypt.hash(codigo, env.BCRYPT_ROUNDS);
export const verificarCodigo = (codigo: string, hash: string): Promise<boolean> => bcrypt.compare(codigo, hash);

export const TTL_MINUTOS = 10;
export const MAX_INTENTOS = 5;
