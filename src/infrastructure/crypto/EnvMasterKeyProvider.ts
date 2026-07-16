import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { IMasterKeyProvider } from '../../core/crypto/IMasterKeyProvider.js';
import { CipherError } from '../../core/errors.js';


export class EnvMasterKeyProvider implements IMasterKeyProvider {
  readonly nombre = 'env' as const;

  constructor(private readonly masterKey: Buffer) {
    if (masterKey.length !== 32) throw new CipherError('Master key debe ser de 32 bytes');
  }

  async generarDataKey(): Promise<{ plaintext: Buffer; cifrada: Buffer }> {
    const plaintext = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return { plaintext, cifrada: Buffer.concat([iv, cipher.getAuthTag(), ct]) };
  }

  async descifrarDataKey(cifrada: Buffer): Promise<Buffer> {
    const iv = cifrada.subarray(0, 12);
    const tag = cifrada.subarray(12, 28);
    const ct = cifrada.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(tag);
    try {
      return Buffer.concat([decipher.update(ct), decipher.final()]);
    } catch {
      throw new CipherError('Data-key corrupta o master key incorrecta');
    }
  }
}
