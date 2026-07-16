import { pool } from '../../core/db.js';
import type { IMasterKeyProvider } from '../../core/crypto/IMasterKeyProvider.js';

export class TenantKeyService {
  private readonly cache = new Map<number, Buffer>();
  private readonly creando = new Set<number>();

  constructor(private readonly master: IMasterKeyProvider) {}

  async precargar(): Promise<void> {
    const { rows } = await pool.query<{ id_municipio: string | number; key_cifrada: Buffer; proveedor: string }>(
      `SELECT id_municipio, key_cifrada, proveedor FROM tenant_keys WHERE activa`,
    );
    for (const r of rows) {
      if (r.proveedor !== this.master.nombre) {
        console.warn(`[tenant-keys] municipio ${r.id_municipio} cifrado con '${r.proveedor}' pero el provider activo es '${this.master.nombre}' — se omite`);
        continue;
      }
      this.cache.set(Number(r.id_municipio), await this.master.descifrarDataKey(r.key_cifrada));
    }
    console.log(`[tenant-keys] ${this.cache.size} data-key(s) cargadas (provider: ${this.master.nombre})`);
  }

  keyDe(idMunicipio: number): Buffer | undefined {
    return this.cache.get(idMunicipio);
  }

  asegurarKey(idMunicipio: number): void {
    if (this.cache.has(idMunicipio) || this.creando.has(idMunicipio)) return;
    this.creando.add(idMunicipio);
    void (async () => {
      try {
        const { cifrada } = await this.master.generarDataKey();
        const { rows } = await pool.query<{ key_cifrada: Buffer }>(
          `INSERT INTO tenant_keys (id_municipio, key_cifrada, proveedor)
           VALUES ($1, $2, $3)
           ON CONFLICT (id_municipio) DO UPDATE SET id_municipio = EXCLUDED.id_municipio
           RETURNING key_cifrada`,
          [idMunicipio, cifrada, this.master.nombre],
        );
        this.cache.set(idMunicipio, await this.master.descifrarDataKey(rows[0]!.key_cifrada));
      } catch (e) {
        console.error(`[tenant-keys] no se pudo crear la llave del municipio ${idMunicipio}:`, e);
      } finally {
        this.creando.delete(idMunicipio);
      }
    })();
  }
}
