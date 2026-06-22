import { pool } from '../../core/db.js';
import type {
  IEstadisticasRepository,
  StatsHoy,
  GananciasRango,
  GananciaViaje,
} from '../domain/repositories/IEstadisticasRepository.js';
import { TZ } from '../application/horario.js';

interface StatsRow {
  viajes_hoy: string;
  ganancias_hoy: string | null;
  viajes_total: string;
  calificacion_promedio: string | null;
}

interface ViajeRow {
  id_viaje: string;
  fecha_fin: Date;
  tarifa: string;
  origen_texto: string | null;
  destino_texto: string | null;
}

export class EstadisticasPostgresRepository implements IEstadisticasRepository {
  async statsHoy(idConductor: number): Promise<StatsHoy> {
    const { rows } = await pool.query<StatsRow>(
      `WITH completados AS (
         SELECT tarifa, fecha_fin
           FROM viajes
          WHERE id_conductor = $1
            AND estado = 'completado'
       )
       SELECT
         COUNT(*) FILTER (
           WHERE (fecha_fin AT TIME ZONE '${TZ}')::date
               = (NOW() AT TIME ZONE '${TZ}')::date
         )::int AS viajes_hoy,
         COALESCE(SUM(tarifa) FILTER (
           WHERE (fecha_fin AT TIME ZONE '${TZ}')::date
               = (NOW() AT TIME ZONE '${TZ}')::date
         ), 0)::float8 AS ganancias_hoy,
         COUNT(*)::int AS viajes_total,
         (SELECT AVG(calificacion)::float8
            FROM evaluaciones
           WHERE id_evaluado = $1
             AND tipo = 'pasajero_a_conductor') AS calificacion_promedio
       FROM completados`,
      [idConductor],
    );
    const r = rows[0]!;
    return {
      viajesHoy: Number(r.viajes_hoy),
      gananciasHoy: Number(r.ganancias_hoy ?? 0),
      viajesTotal: Number(r.viajes_total),
      calificacionPromedio:
        r.calificacion_promedio == null ? null : Number(r.calificacion_promedio),
    };
  }

  async ganancias(idConductor: number, desde: string, hasta: string): Promise<GananciasRango> {
    const { rows } = await pool.query<ViajeRow>(
      `SELECT id_viaje, fecha_fin, tarifa, origen_texto, destino_texto
         FROM viajes
        WHERE id_conductor = $1
          AND estado = 'completado'
          AND (fecha_fin AT TIME ZONE '${TZ}')::date >= $2::date
          AND (fecha_fin AT TIME ZONE '${TZ}')::date <= $3::date
        ORDER BY fecha_fin DESC`,
      [idConductor, desde, hasta],
    );
    const viajes: GananciaViaje[] = rows.map((row) => ({
      idViaje: Number(row.id_viaje),
      fechaFin: row.fecha_fin.toISOString(),
      tarifa: Number(row.tarifa),
      origenTexto: row.origen_texto,
      destinoTexto: row.destino_texto,
    }));
    return {
      totalViajes: viajes.length,
      totalGanancias: viajes.reduce((acc, v) => acc + v.tarifa, 0),
      viajes,
    };
  }
}
