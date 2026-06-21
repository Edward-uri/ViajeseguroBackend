import bcrypt from 'bcryptjs';
import { env } from '../../core/env.js';

export const hashPassword = (plano: string): Promise<string> => bcrypt.hash(plano, env.BCRYPT_ROUNDS);
export const verifyPassword = (plano: string, hash: string): Promise<boolean> => bcrypt.compare(plano, hash);
