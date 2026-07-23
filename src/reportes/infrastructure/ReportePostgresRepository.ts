import { pool } from '../../core/db.js';
import type { IReporteRepository } from '../domain/repositories/IReporteRepository.js';
import type { Reporte, RolReportado } from '../domain/Reporte.js';
import { YaReportadoError } from '../domain/errors.js';

interface ReporteRow {
  id_reporte: string | number;
  id_viaje: string | number | null;
  id_reportante: string | number;
  id_reportado: string | number;
  rol_reportado: RolReportado;
  motivo: string;
  comentario: string | null;
  creado_en: Date | string | null;
}

function mapReporte(row: ReporteRow): Reporte {
  return {
    idReporte: Number(row.id_reporte),
    idViaje: row.id_viaje == null ? null : Number(row.id_viaje),
    idReportante: Number(row.id_reportante),
    idReportado: Number(row.id_reportado),
    rolReportado: row.rol_reportado,
    motivo: row.motivo,
    comentario: row.comentario,
    creadoEn: row.creado_en == null ? null : new Date(row.creado_en),
  };
}

export class ReportePostgresRepository implements IReporteRepository {
  async crear(args: {
    idViaje: number | null;
    idReportante: number;
    idReportado: number;
    rolReportado: RolReportado;
    motivo: string;
    comentario: string | null;
  }): Promise<Reporte> {
    try {
      const { rows } = await pool.query<ReporteRow>(
        `INSERT INTO reportes (id_viaje, id_reportante, id_reportado, rol_reportado, motivo, comentario)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [args.idViaje, args.idReportante, args.idReportado, args.rolReportado, args.motivo, args.comentario],
      );
      return mapReporte(rows[0]);
    } catch (e) {
      // 23505 = ya existe un reporte en esa dirección (par ya bloqueado).
      if ((e as { code?: string }).code === '23505') throw new YaReportadoError();
      throw e;
    }
  }

  async estanBloqueados(idA: number, idB: number): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT 1 FROM reportes
        WHERE (id_reportante = $1 AND id_reportado = $2)
           OR (id_reportante = $2 AND id_reportado = $1)
        LIMIT 1`,
      [idA, idB],
    );
    return rows.length > 0;
  }

  async usuariosBloqueadosCon(idUsuario: number): Promise<number[]> {
    const { rows } = await pool.query<{ id: string | number }>(
      `SELECT DISTINCT CASE WHEN id_reportante = $1 THEN id_reportado ELSE id_reportante END AS id
         FROM reportes
        WHERE id_reportante = $1 OR id_reportado = $1`,
      [idUsuario],
    );
    return rows.map((r) => Number(r.id));
  }

  async contarReportesDeConductor(idConductor: number): Promise<number> {
    const { rows } = await pool.query<{ n: string | number }>(
      `SELECT COUNT(*)::int AS n FROM reportes WHERE id_reportado = $1 AND rol_reportado = 'conductor'`,
      [idConductor],
    );
    return Number(rows[0]?.n ?? 0);
  }
}
