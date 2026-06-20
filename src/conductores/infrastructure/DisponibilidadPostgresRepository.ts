import { pool } from '../../core/db.js';
import type { Disponibilidad } from '../domain/Disponibilidad.js';
import type { IDisponibilidadRepository } from '../domain/repositories/IDisponibilidadRepository.js';

interface Row {
  id_conductor: string | number;
  disponible: boolean;
  lat: string | null;
  lng: string | null;
  actualizado_en: Date | null;
}

function map(row: Row | undefined): Disponibilidad | null {
  if (!row) return null;
  return {
    idConductor: Number(row.id_conductor),
    disponible: row.disponible,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    actualizadoEn: row.actualizado_en,
  };
}

export class DisponibilidadPostgresRepository implements IDisponibilidadRepository {
  async upsert(args: { idConductor: number; disponible: boolean; lat: number | null; lng: number | null }): Promise<Disponibilidad> {
    const { rows } = await pool.query<Row>(
      `INSERT INTO conductor_disponibilidad (id_conductor, disponible, lat, lng, actualizado_en)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (id_conductor) DO UPDATE SET
         disponible = EXCLUDED.disponible,
         lat = EXCLUDED.lat,
         lng = EXCLUDED.lng,
         actualizado_en = NOW()
       RETURNING *`,
      [args.idConductor, args.disponible, args.lat, args.lng],
    );
    return map(rows[0])!;
  }

  async porConductor(idConductor: number): Promise<Disponibilidad | null> {
    const { rows } = await pool.query<Row>('SELECT * FROM conductor_disponibilidad WHERE id_conductor = $1', [idConductor]);
    return map(rows[0]);
  }
}
