import { pool } from '../../core/db.js';
import { Propietario, PropietarioBuilder } from '../domain/Propietario.js';
import type { IPropietarioRepository } from '../domain/repositories/IPropietarioRepository.js';

interface Row {
  id_propietario: string | number;
  rfc: string | null;
  razon_social: string | null;
}

function map(row: Row | undefined): Propietario | null {
  if (!row) return null;
  return new PropietarioBuilder()
    .idPropietario(Number(row.id_propietario))
    .rfc(row.rfc)
    .razonSocial(row.razon_social)
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
    const { rows } = await pool.query<Row>(
      `INSERT INTO propietarios (id_propietario, rfc, razon_social)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_propietario) DO UPDATE SET
         rfc = EXCLUDED.rfc,
         razon_social = EXCLUDED.razon_social
       RETURNING *`,
      [a.idPropietario, a.rfc, a.razonSocial],
    );
    return map(rows[0])!;
  }
}
