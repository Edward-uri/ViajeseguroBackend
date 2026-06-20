import bcrypt from 'bcryptjs';
import { env } from '../../core/env.js';

const DIGITS = 4;

export function generarCodigo(): string {
  let n = 0;
  for (let i = 0; i < DIGITS; i++) n = n * 10 + Math.floor(Math.random() * 10);
  return String(n).padStart(DIGITS, '0');
}

export const hashCodigo = (codigo: string): Promise<string> => bcrypt.hash(codigo, env.BCRYPT_ROUNDS);
export const verificarCodigo = (codigo: string, hash: string): Promise<boolean> => bcrypt.compare(codigo, hash);

export const TTL_MINUTOS = 10;
export const MAX_INTENTOS = 5;
