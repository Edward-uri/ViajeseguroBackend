import { createHmac } from 'node:crypto';
import { env } from '../../core/env.js';
import { AesGcmCipher } from './AesGcmCipher.js';
import { CipherConfigError } from '../../core/errors.js';
import { CipherCodec } from '../../core/crypto/CipherCodec.js';
import type { ICipher } from '../../core/crypto/ICipher.js';
import { EnvelopeCipher } from './EnvelopeCipher.js';
import { EnvMasterKeyProvider } from './EnvMasterKeyProvider.js';
import { AwsKmsProvider } from './AwsKmsProvider.js';
import { TenantKeyService } from './TenantKeyService.js';

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
  const enc = Buffer.from(opts.cipherKey, 'base64');
  const idx = Buffer.from(opts.indexKey, 'base64');
  return new AesGcmCipher(enc, idx);
}

const globalCipher: ICipher = buildCipher({
  cipherKey: env.CIPHER_KEY,
  indexKey: env.CIPHER_INDEX_KEY,
  allowTestDefault: env.NODE_ENV === 'test',
});

const rawEncKey = env.CIPHER_KEY ? Buffer.from(env.CIPHER_KEY, 'base64') : TEST_ENC_KEY;
const rawIndexKey = env.CIPHER_INDEX_KEY ? Buffer.from(env.CIPHER_INDEX_KEY, 'base64') : TEST_INDEX_KEY;

const masterKey = createHmac('sha256', rawEncKey).update('tenant-key-wrap').digest();

const masterProvider = env.KMS_KEY_ID
  ? new AwsKmsProvider(env.KMS_KEY_ID)
  : new EnvMasterKeyProvider(masterKey);

export const tenantKeys = new TenantKeyService(masterProvider);

export const cipher: ICipher = new EnvelopeCipher(globalCipher, tenantKeys, rawIndexKey);

export const cipherCodec = new CipherCodec(cipher);
