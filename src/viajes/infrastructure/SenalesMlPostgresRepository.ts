import { pool } from '../../core/db.js';
import type {
  ISenalesMlRepository,
  EventoDemandaRegistro,
} from '../domain/repositories/ISenalesMlRepository.js';

export class SenalesMlPostgresRepository implements ISenalesMlRepository {
  async copiarDisponibilidadActual(): Promise<number> {
    const res = await pool.query(
      `INSERT INTO conductor_disponibilidad_snapshot (id_conductor, disponible, lat, lng)
       SELECT id_conductor, disponible, lat, lng FROM conductor_disponibilidad`,
    );
    return res.rowCount ?? 0;
  }

  async huboEventoReciente(idUsuario: number, tipo: string, segundos: number): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM eventos_demanda
        WHERE id_usuario = $1 AND tipo = $2 AND fecha > NOW() - ($3 || ' seconds')::interval
        LIMIT 1`,
      [idUsuario, tipo, String(segundos)],
    );
    return rows.length > 0;
  }

  async contarConductoresDisponibles(idMunicipio: number | null): Promise<number> {
    const { rows } = await pool.query<{ n: string }>(
      `SELECT COUNT(*) AS n
         FROM conductor_disponibilidad cd
         JOIN conductores c ON c.id_conductor = cd.id_conductor
        WHERE cd.disponible = TRUE
          AND ($1::bigint IS NULL OR c.id_municipio = $1)`,
      [idMunicipio],
    );
    return Number(rows[0]?.n ?? 0);
  }

  async registrarEvento(e: EventoDemandaRegistro): Promise<void> {
    await pool.query(
      `INSERT INTO eventos_demanda (id_usuario, tipo, lat, lng, id_municipio, n_conductores_disponibles)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [e.idUsuario, e.tipo, e.lat, e.lng, e.idMunicipio, e.nConductoresDisponibles],
    );
  }
}
