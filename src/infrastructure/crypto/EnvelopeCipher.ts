import type { ICipher } from '../../core/crypto/ICipher.js';
import { CipherError } from '../../core/errors.js';
import { tenantActual } from '../../core/tenantContext.js';
import { AesGcmCipher } from './AesGcmCipher.js';
import type { TenantKeyService } from './TenantKeyService.js';

const V2_BYTE = 2;


export class EnvelopeCipher implements ICipher {
  private readonly porTenant = new Map<number, AesGcmCipher>();

  constructor(
    private readonly global: ICipher,
    private readonly keys: TenantKeyService,
    private readonly indexKey: Buffer,
  ) {}

  private cipherDe(idMunicipio: number): AesGcmCipher | undefined {
    const existente = this.porTenant.get(idMunicipio);
    if (existente) return existente;
    const key = this.keys.keyDe(idMunicipio);
    if (!key) return undefined;
    const c = new AesGcmCipher(key, this.indexKey);
    this.porTenant.set(idMunicipio, c);
    return c;
  }

  private tenantCipherActual(): { id: number; cipher: AesGcmCipher } | null {
    const t = tenantActual()?.tenant;
    if (t == null) return null;
    const cipher = this.cipherDe(t);
    if (!cipher) {
      this.keys.asegurarKey(t); // la próxima escritura ya será v2
      return null;
    }
    return { id: t, cipher };
  }

  cifrar(textoPlano: string): string {
    const t = this.tenantCipherActual();
    if (!t) return this.global.cifrar(textoPlano);
    return `v2:${t.id}:${t.cipher.cifrar(textoPlano).slice(3)}`;
  }

  descifrar(blob: string): string {
    if (!blob.startsWith('v2:')) return this.global.descifrar(blob);
    const resto = blob.slice(3);
    const sep = resto.indexOf(':');
    const id = Number(resto.slice(0, sep));
    if (sep < 1 || !Number.isInteger(id)) throw new CipherError('Blob v2 malformado');
    const cipher = this.cipherDe(id);
    if (!cipher) throw new CipherError(`Sin data-key para el municipio ${id}`);
    return cipher.descifrar(`v1:${resto.slice(sep + 1)}`);
  }

  cifrarBytes(contenido: Buffer): Buffer {
    const t = this.tenantCipherActual();
    if (!t) return this.global.cifrarBytes(contenido);
    const municipio = Buffer.alloc(8);
    municipio.writeBigUInt64BE(BigInt(t.id));
    return Buffer.concat([Buffer.from([V2_BYTE]), municipio, t.cipher.cifrarBytes(contenido).subarray(1)]);
  }

  descifrarBytes(blob: Buffer): Buffer {
    if (blob.length === 0 || blob[0] !== V2_BYTE) return this.global.descifrarBytes(blob);
    const id = Number(blob.subarray(1, 9).readBigUInt64BE());
    const cipher = this.cipherDe(id);
    if (!cipher) throw new CipherError(`Sin data-key para el municipio ${id}`);
    return cipher.descifrarBytes(Buffer.concat([Buffer.from([1]), blob.subarray(9)]));
  }

  blindIndex(valor: string): string {
    return this.global.blindIndex(valor);
  }
}
