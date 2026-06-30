import { pool } from '../../core/db.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';
import { Propietario, PropietarioBuilder } from '../domain/Propietario.js';
import type { IPropietarioRepository } from '../domain/repositories/IPropietarioRepository.js';

interface Row {
  id_propietario: string | number;
  rfc: string | null;
  razon_social: string | null;
}

function map(row: Row | undefined): Propietario | null {
  if (!row) return null;
  const dec = cipherCodec.decodeDeRow('propietarios', row as unknown as Record<string, unknown>);
  return new PropietarioBuilder()
    .idPropietario(Number(row.id_propietario))
    .rfc((dec.rfc as string | null) ?? row.rfc)
    .razonSocial((dec.razon_social as string | null) ?? row.razon_social)
    .build();
}

export class PropietarioPostgresRepository implements IPropietarioRepository {
  async asegurarExiste(idPropietario: number): Promise<void> {
    await pool.query(
      'INSERT INTO propietarios (id_propietario) VALUES ($1) ON CONFLICT (id_propietario) DO NOTHING',
      [idPropietario],
    );
  }

  async findById(idPropietario: number): Promise<Propietario | null> {
    const { rows } = await pool.query<Row>('SELECT * FROM propietarios WHERE id_propietario = $1', [idPropietario]);
    return map(rows[0]);
  }

  async upsertPerfil(a: { idPropietario: number; rfc: string | null; razonSocial: string | null }): Promise<Propietario> {
    const enc = cipherCodec.encodeParaInsert('propietarios', { rfc: a.rfc, razon_social: a.razonSocial });
    const { rows } = await pool.query<Row>(
      `INSERT INTO propietarios (id_propietario, rfc_enc, rfc_bidx, razon_social_enc)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_propietario) DO UPDATE SET
         rfc_enc = EXCLUDED.rfc_enc,
         rfc_bidx = EXCLUDED.rfc_bidx,
         razon_social_enc = EXCLUDED.razon_social_enc
       RETURNING *`,
      [a.idPropietario, enc.rfc_enc, enc.rfc_bidx, enc.razon_social_enc],
    );
    return map(rows[0])!;
  }
}
