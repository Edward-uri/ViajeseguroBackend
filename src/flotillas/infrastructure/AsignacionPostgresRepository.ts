import { pool } from '../../core/db.js';
import type { PoolClient } from 'pg';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import type { ConductorAsignado, TipoTurno } from '../domain/ConductorAsignado.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';

/** Términos de la relación (turno/renta/días/horario); todos opcionales para el
 *  alta 'propia' que no los captura. */
type Terminos = {
  tipoTurno?: TipoTurno | null;
  rentaTurno?: number | null;
  dias?: string[] | null;
  horario?: string | null;
};

export class AsignacionPostgresRepository implements IAsignacionRepository {
  /** Upsert de asignación activa. Si ya hay activa para (vehiculo, conductor), no duplica.
   *  Si había una revocada (activo=false), la reactiva.
   *  Copia los términos (turno/renta/días/horario) cuando vienen (aceptar de la bolsa).
   *  `client` opcional: para participar en una transacción externa (mismo client, mismo commit/rollback). */
  async asignar(
    args: { idVehiculo: number; idConductor: number; origen?: 'propia' | 'bolsa' } & Terminos,
    client?: PoolClient,
  ): Promise<void> {
    const { idVehiculo, idConductor, origen = 'propia' } = args;
    const t = [args.tipoTurno ?? null, args.rentaTurno ?? null, args.dias ?? null, args.horario ?? null];
    const exec = client ?? pool;
    // Reactiva una previa revocada si existe; el UPDATE no toca el índice parcial salvo que la reactive.
    const upd = await exec.query(
      `UPDATE asignaciones_conductor_vehiculo
          SET activo = TRUE, origen = $3, tipo_turno = $4, renta_turno = $5, dias = $6, horario = $7
        WHERE id_vehiculo = $1 AND id_conductor = $2 AND activo = FALSE`,
      [idVehiculo, idConductor, origen, ...t],
    );
    if ((upd.rowCount ?? 0) > 0) return;
    // No había revocada que reactivar: inserta. ON CONFLICT sobre el índice parcial uq_asignacion_activa
    // hace idempotente el caso "ya existe activa".
    await exec.query(
      `INSERT INTO asignaciones_conductor_vehiculo (id_vehiculo, id_conductor, origen, tipo_turno, renta_turno, dias, horario)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id_vehiculo, id_conductor) WHERE activo DO NOTHING`,
      [idVehiculo, idConductor, origen, ...t],
    );
  }

  /** Actualiza los términos de la asignación activa (dueño edita al conductor). */
  async actualizarTerminos(args: {
    idVehiculo: number; idConductor: number; tipoTurno: TipoTurno; rentaTurno: number; dias: string[]; horario: string | null;
  }): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE asignaciones_conductor_vehiculo
          SET tipo_turno = $3, renta_turno = $4, dias = $5, horario = $6
        WHERE id_vehiculo = $1 AND id_conductor = $2 AND activo`,
      [args.idVehiculo, args.idConductor, args.tipoTurno, args.rentaTurno, args.dias, args.horario],
    );
    return (rowCount ?? 0) > 0;
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

  async contarActivosPorVehiculos(ids: number[]): Promise<Record<number, number>> {
    if (ids.length === 0) return {};
    const { rows } = await pool.query<{ id_vehiculo: string | number; n: string | number }>(
      `SELECT id_vehiculo, COUNT(*)::int AS n
         FROM asignaciones_conductor_vehiculo
        WHERE id_vehiculo = ANY($1) AND activo
        GROUP BY id_vehiculo`,
      [ids],
    );
    const out: Record<number, number> = {};
    for (const r of rows) out[Number(r.id_vehiculo)] = Number(r.n);
    return out;
  }

  async listarAsignacionesDeVehiculo(idVehiculo: number): Promise<ConductorAsignado[]> {
    const { rows } = await pool.query<{
      id_conductor: string | number; origen: 'propia' | 'bolsa';
      tipo_turno: TipoTurno | null; renta_turno: string | number | null; dias: string[] | null; horario: string | null;
      nombre_enc: string | null; apellido_paterno_enc: string | null; nombre: string | null; apellido_paterno: string | null;
      foto_perfil_url: string | null; foto_perfil_s3_key: string | null; calificacion: string | null;
    }>(
      `SELECT a.id_conductor, a.origen, a.tipo_turno, a.renta_turno, a.dias, a.horario,
              per.nombre_enc, per.apellido_paterno_enc, per.nombre, per.apellido_paterno,
              u.foto_perfil_url, u.foto_perfil_s3_key,
              (SELECT AVG(calificacion) FROM evaluaciones WHERE id_evaluado = u.id_usuario) AS calificacion
         FROM asignaciones_conductor_vehiculo a
         JOIN usuarios u ON u.id_usuario = a.id_conductor
         LEFT JOIN personas per ON per.id_persona = u.id_usuario
        WHERE a.id_vehiculo = $1 AND a.activo
        ORDER BY a.id_asignacion DESC`,
      [idVehiculo],
    );
    return rows.map((r) => {
      const dec = cipherCodec.decodeDeRow('personas', {
        nombre_enc: r.nombre_enc, apellido_paterno_enc: r.apellido_paterno_enc,
      });
      const nombre = (dec.nombre as string | null) ?? r.nombre;
      const apellido = (dec.apellido_paterno as string | null) ?? r.apellido_paterno;
      const idConductor = Number(r.id_conductor);
      return {
        idConductor,
        nombre: [nombre, apellido].filter(Boolean).join(' ') || null,
        fotoUrl: (r.foto_perfil_s3_key ?? r.foto_perfil_url) ? `/api/users/${idConductor}/photo` : null,
        calificacion: r.calificacion == null ? null : Math.round(Number(r.calificacion) * 10) / 10,
        origen: r.origen,
        tipoTurno: r.tipo_turno,
        rentaTurno: r.renta_turno == null ? null : Number(r.renta_turno),
        dias: r.dias ?? [],
        horario: r.horario,
      };
    });
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
