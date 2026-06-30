import { env } from '../../core/env.js';
import { AesGcmCipher } from './AesGcmCipher.js';
import { CipherConfigError } from '../../core/errors.js';
import { CipherCodec } from '../../core/crypto/CipherCodec.js';
import type { ICipher } from '../../core/crypto/ICipher.js';

const TEST_ENC_KEY = Buffer.alloc(32, 7);
const TEST_INDEX_KEY = Buffer.alloc(32, 9);

export function buildCipher(opts: {
  cipherKey?: string;
  indexKey?: string;
  allowTestDefault?: boolean;
}): ICipher {
  if (!opts.cipherKey || !opts.indexKey) {
    if (opts.allowTestDefault) return new AesGcmCipher(TEST_ENC_KEY, TEST_INDEX_KEY);
    throw new CipherConfigError('Faltan CIPHER_KEY y/o CIPHER_INDEX_KEY');
  }
  // base64 inválido o de longitud incorrecta -> el constructor de AesGcmCipher lanza CipherConfigError.
  const enc = Buffer.from(opts.cipherKey, 'base64');
  const idx = Buffer.from(opts.indexKey, 'base64');
  return new AesGcmCipher(enc, idx);
}

export const cipher: ICipher = buildCipher({
  cipherKey: env.CIPHER_KEY,
  indexKey: env.CIPHER_INDEX_KEY,
  allowTestDefault: env.NODE_ENV === 'test',
});

/** Codec compartido: cifra/descifra filas y calcula blind index según SENSITIVE_FIELDS. */
export const cipherCodec = new CipherCodec(cipher);
