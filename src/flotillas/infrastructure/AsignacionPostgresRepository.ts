import { pool } from '../../core/db.js';
import type { PoolClient } from 'pg';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';

export class AsignacionPostgresRepository implements IAsignacionRepository {
  /** Upsert de asignación activa. Si ya hay activa para (vehiculo, conductor), no duplica.
   *  Si había una revocada (activo=false), la reactiva.
   *  `client` opcional: para participar en una transacción externa (mismo client, mismo commit/rollback). */
  async asignar(
    { idVehiculo, idConductor, origen = 'propia' }: { idVehiculo: number; idConductor: number; origen?: 'propia' | 'bolsa' },
    client?: PoolClient,
  ): Promise<void> {
    const exec = client ?? pool;
    // Reactiva una previa revocada si existe; el UPDATE no toca el índice parcial salvo que la reactive.
    const upd = await exec.query(
      `UPDATE asignaciones_conductor_vehiculo
          SET activo = TRUE, origen = $3
        WHERE id_vehiculo = $1 AND id_conductor = $2 AND activo = FALSE`,
      [idVehiculo, idConductor, origen],
    );
    if ((upd.rowCount ?? 0) > 0) return;
    // No había revocada que reactivar: inserta. ON CONFLICT sobre el índice parcial uq_asignacion_activa
    // hace idempotente el caso "ya existe activa".
    await exec.query(
      `INSERT INTO asignaciones_conductor_vehiculo (id_vehiculo, id_conductor, origen)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_vehiculo, id_conductor) WHERE activo DO NOTHING`,
      [idVehiculo, idConductor, origen],
    );
  }

  async revocar({ idVehiculo, idConductor }: { idVehiculo: number; idConductor: number }): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE asignaciones_conductor_vehiculo
          SET activo = FALSE
        WHERE id_vehiculo = $1 AND id_conductor = $2 AND activo = TRUE`,
      [idVehiculo, idConductor],
    );
    return (rowCount ?? 0) > 0;
  }

  async listarConductoresPorVehiculo(idVehiculo: number): Promise<number[]> {
    const { rows } = await pool.query<{ id_conductor: string | number }>(
      `SELECT id_conductor FROM asignaciones_conductor_vehiculo
        WHERE id_vehiculo = $1 AND activo ORDER BY id_conductor`,
      [idVehiculo],
    );
    return rows.map((r) => Number(r.id_conductor));
  }

  async vehiculosAsignados(idConductor: number): Promise<number[]> {
    const { rows } = await pool.query<{ id_vehiculo: string | number }>(
      `SELECT id_vehiculo FROM asignaciones_conductor_vehiculo
        WHERE id_conductor = $1 AND activo ORDER BY id_vehiculo`,
      [idConductor],
    );
    return rows.map((r) => Number(r.id_vehiculo));
  }

  /** Autorizado a manejar = es dueño del vehículo OR tiene asignación activa. Un solo SQL. */
  async conductorAutorizado(idConductor: number, idVehiculo: number): Promise<boolean> {
    const { rows } = await pool.query<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM vehiculos v WHERE v.id_vehiculo = $2 AND v.id_propietario = $1
         UNION ALL
         SELECT 1 FROM asignaciones_conductor_vehiculo a
          WHERE a.id_vehiculo = $2 AND a.id_conductor = $1 AND a.activo
       ) AS ok`,
      [idConductor, idVehiculo],
    );
    return rows[0]?.ok === true;
  }

  async existeConductor(idConductor: number): Promise<boolean> {
    const { rows } = await pool.query<{ ok: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM conductores WHERE id_conductor = $1) AS ok',
      [idConductor],
    );
    return rows[0]?.ok === true;
  }
}
