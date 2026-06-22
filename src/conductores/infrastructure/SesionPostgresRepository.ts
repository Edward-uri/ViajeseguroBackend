import { pool } from '../../core/db.js';
import type { ISesionRepository } from '../domain/repositories/ISesionRepository.js';

export class SesionPostgresRepository implements ISesionRepository {
  async abrir(idConductor: number): Promise<void> {
    await pool.query(
      `INSERT INTO conductor_sesiones (id_conductor, inicio, fin)
       SELECT $1, NOW(), NULL
       WHERE NOT EXISTS (
         SELECT 1 FROM conductor_sesiones
         WHERE id_conductor = $1 AND fin IS NULL
       )
       ON CONFLICT (id_conductor) WHERE fin IS NULL DO NOTHING`,
      [idConductor],
    );
  }

  async cerrar(idConductor: number): Promise<void> {
    await pool.query(
      `UPDATE conductor_sesiones
          SET fin = NOW()
        WHERE id_conductor = $1 AND fin IS NULL`,
      [idConductor],
    );
  }

  async horasEnLinea(idConductor: number, desdeTs: string, hastaTs: string): Promise<number> {
    const { rows } = await pool.query<{ horas: string | null }>(
      `SELECT COALESCE(
                SUM(
                  GREATEST(
                    EXTRACT(EPOCH FROM (
                      LEAST(COALESCE(fin, NOW()), $3::timestamptz)
                      - GREATEST(inicio, $2::timestamptz)
                    )),
                    0
                  )
                ) / 3600.0,
                0
              )::float8 AS horas
         FROM conductor_sesiones
        WHERE id_conductor = $1
          AND inicio < $3::timestamptz
          AND COALESCE(fin, NOW()) > $2::timestamptz`,
      [idConductor, desdeTs, hastaTs],
    );
    return Number(rows[0]?.horas ?? 0);
  }
}
