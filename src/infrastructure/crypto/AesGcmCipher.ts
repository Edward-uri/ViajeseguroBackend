import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'node:crypto';
import type { ICipher } from '../../core/crypto/ICipher.js';
import { CipherConfigError, CipherError } from '../../core/errors.js';

const VERSION = 'v1';
const VERSION_BYTE = 1;
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;

export class AesGcmCipher implements ICipher {
  constructor(
    private readonly encKey: Buffer,
    private readonly indexKey: Buffer,
  ) {
    if (encKey.length !== KEY_LEN) throw new CipherConfigError('CIPHER_KEY debe ser de 32 bytes');
    if (indexKey.length !== KEY_LEN) throw new CipherConfigError('CIPHER_INDEX_KEY debe ser de 32 bytes');
  }

  cifrar(textoPlano: string): string {
    const iv = randomBytes(IV_LEN);
    const c = createCipheriv('aes-256-gcm', this.encKey, iv);
    const ct = Buffer.concat([c.update(textoPlano, 'utf8'), c.final()]);
    const tag = c.getAuthTag();
    return `${VERSION}:${Buffer.concat([iv, tag, ct]).toString('base64')}`;
  }

  descifrar(blob: string): string {
    const sep = blob.indexOf(':');
    const version = sep >= 0 ? blob.slice(0, sep) : '';
    const payload = sep >= 0 ? blob.slice(sep + 1) : '';
    if (version !== VERSION || !payload) throw new CipherError('Formato de cifrado no reconocido');
    const raw = Buffer.from(payload, 'base64');
    if (raw.length < IV_LEN + TAG_LEN) throw new CipherError('Blob cifrado truncado');
    const iv = raw.subarray(0, IV_LEN);
    const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ct = raw.subarray(IV_LEN + TAG_LEN);
    const d = createDecipheriv('aes-256-gcm', this.encKey, iv);
    d.setAuthTag(tag);
    try {
      return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
    } catch {
      throw new CipherError('No se pudo descifrar (datos manipulados o llave incorrecta)');
    }
  }

  cifrarBytes(contenido: Buffer): Buffer {
    const iv = randomBytes(IV_LEN);
    const c = createCipheriv('aes-256-gcm', this.encKey, iv);
    const ct = Buffer.concat([c.update(contenido), c.final()]);
    const tag = c.getAuthTag();
    return Buffer.concat([Buffer.from([VERSION_BYTE]), iv, tag, ct]);
  }

  descifrarBytes(blob: Buffer): Buffer {
    if (blob.length < 1 + IV_LEN + TAG_LEN || blob[0] !== VERSION_BYTE) {
      throw new CipherError('Blob de bytes inválido');
    }
    const iv = blob.subarray(1, 1 + IV_LEN);
    const tag = blob.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN);
    const ct = blob.subarray(1 + IV_LEN + TAG_LEN);
    const d = createDecipheriv('aes-256-gcm', this.encKey, iv);
    d.setAuthTag(tag);
    try {
      return Buffer.concat([d.update(ct), d.final()]);
    } catch {
      throw new CipherError('No se pudo descifrar el archivo');
    }
  }

  blindIndex(valor: string): string {
    const normalizado = valor.trim().toLowerCase();
    return createHmac('sha256', this.indexKey).update(normalizado, 'utf8').digest('hex');
  }
}
