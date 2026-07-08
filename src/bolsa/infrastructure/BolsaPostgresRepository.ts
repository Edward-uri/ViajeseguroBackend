import { pool, withTransaction } from '../../core/db.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';
import type { Vacante, VacanteConVehiculo, VacanteConPendientes } from '../domain/Vacante.js';
import type { Postulacion, PostulacionConConductor, PostulacionConVacante } from '../domain/Postulacion.js';
import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { IAsignacionRepository } from '../../flotillas/domain/repositories/IAsignacionRepository.js';
import {
  VacanteYaAbiertaError, YaPostulasteError,
  VacanteCerradaError, NoEsTuVacanteError, PostulacionNoPendienteError, PostulacionNoEncontradaError,
} from '../domain/errors.js';

interface VacanteRow {
  id_vacante: string | number;
  id_propietario: string | number;
  id_vehiculo: string | number;
  id_municipio: string | number;
  condiciones: string | null;
  estado: 'abierta' | 'cerrada';
}

function mapVacante(row: VacanteRow | undefined): Vacante | null {
  if (!row) return null;
  return {
    idVacante: Number(row.id_vacante),
    idPropietario: Number(row.id_propietario),
    idVehiculo: Number(row.id_vehiculo),
    idMunicipio: Number(row.id_municipio),
    condiciones: row.condiciones,
    estado: row.estado,
  };
}

interface PostulacionRow {
  id_postulacion: string | number;
  id_vacante: string | number;
  id_conductor: string | number;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'retirada';
  mensaje: string | null;
}

function mapPostulacion(row: PostulacionRow | undefined): Postulacion | null {
  if (!row) return null;
  return {
    idPostulacion: Number(row.id_postulacion),
    idVacante: Number(row.id_vacante),
    idConductor: Number(row.id_conductor),
    estado: row.estado,
    mensaje: row.mensaje,
  };
}

export class BolsaPostgresRepository implements IBolsaRepository {
  constructor(private readonly asignaciones: IAsignacionRepository) {}

  async crearVacante(args: {
    idPropietario: number; idVehiculo: number; idMunicipio: number; condiciones: string | null;
  }): Promise<Vacante> {
    try {
      const { rows } = await pool.query<VacanteRow>(
        `INSERT INTO vacantes (id_propietario, id_vehiculo, id_municipio, condiciones)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [args.idPropietario, args.idVehiculo, args.idMunicipio, args.condiciones],
      );
      return mapVacante(rows[0])!;
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw new VacanteYaAbiertaError();
      throw e;
    }
  }

  async vacantePorId(idVacante: number): Promise<Vacante | null> {
    const { rows } = await pool.query<VacanteRow>('SELECT * FROM vacantes WHERE id_vacante = $1', [idVacante]);
    return mapVacante(rows[0]);
  }

  async vacanteAbiertaPorVehiculo(idVehiculo: number): Promise<Vacante | null> {
    const { rows } = await pool.query<VacanteRow>(
      `SELECT * FROM vacantes WHERE id_vehiculo = $1 AND estado = 'abierta'`,
      [idVehiculo],
    );
    return mapVacante(rows[0]);
  }

  async listarAbiertasPorMunicipio(idMunicipio: number): Promise<VacanteConVehiculo[]> {
    const { rows } = await pool.query<VacanteRow & {
      placa_enc: string | null; placa: string | null; modelo: string | null; color: string | null; anio: number | null;
    }>(
      `SELECT v.*, veh.placa_enc, veh.placa, veh.modelo, veh.color, veh.anio
         FROM vacantes v
         JOIN vehiculos veh ON veh.id_vehiculo = v.id_vehiculo
        WHERE v.id_municipio = $1 AND v.estado = 'abierta'
        ORDER BY v.id_vacante DESC`,
      [idMunicipio],
    );
    return rows.map((r) => ({
      ...mapVacante(r)!,
      placa: ((cipherCodec.decodeDeRow('vehiculos', { placa_enc: r.placa_enc }).placa as string | null) ?? r.placa) as string,
      modelo: r.modelo,
      color: r.color,
      anio: r.anio == null ? null : Number(r.anio),
    }));
  }

  async listarMisVacantes(idPropietario: number): Promise<VacanteConPendientes[]> {
    const { rows } = await pool.query<VacanteRow & { pendientes: string | number }>(
      `SELECT v.*, COUNT(p.id_postulacion) FILTER (WHERE p.estado = 'pendiente') AS pendientes
         FROM vacantes v
         LEFT JOIN postulaciones p ON p.id_vacante = v.id_vacante
        WHERE v.id_propietario = $1
        GROUP BY v.id_vacante
        ORDER BY v.id_vacante DESC`,
      [idPropietario],
    );
    return rows.map((r) => ({ ...mapVacante(r)!, postulacionesPendientes: Number(r.pendientes) }));
  }

  async cerrarVacante(idVacante: number): Promise<Vacante> {
    const { rows } = await pool.query<VacanteRow>(
      `UPDATE vacantes SET estado = 'cerrada' WHERE id_vacante = $1 RETURNING *`,
      [idVacante],
    );
    return mapVacante(rows[0])!;
  }

  async crearPostulacion(args: { idVacante: number; idConductor: number; mensaje: string | null }): Promise<Postulacion> {
    // Upsert: insert normal si no existe; revive una 'retirada' propia (re-postular tras retirar, permitido).
    // Un conflicto con cualquier estado que NO sea 'retirada' no matchea el WHERE del DO UPDATE → 0 filas RETURNING.
    const { rows } = await pool.query<PostulacionRow>(
      `INSERT INTO postulaciones (id_vacante, id_conductor, mensaje)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_vacante, id_conductor) DO UPDATE
         SET estado = 'pendiente', mensaje = EXCLUDED.mensaje, updated_at = NOW()
         WHERE postulaciones.estado = 'retirada'
       RETURNING *`,
      [args.idVacante, args.idConductor, args.mensaje],
    );
    if (!rows[0]) throw new YaPostulasteError();
    return mapPostulacion(rows[0])!;
  }

  async postulacionPorId(idPostulacion: number): Promise<Postulacion | null> {
    const { rows } = await pool.query<PostulacionRow>(
      'SELECT * FROM postulaciones WHERE id_postulacion = $1',
      [idPostulacion],
    );
    return mapPostulacion(rows[0]);
  }

  async retirarPostulacion(idPostulacion: number): Promise<Postulacion> {
    const { rows } = await pool.query<PostulacionRow>(
      `UPDATE postulaciones SET estado = 'retirada'
        WHERE id_postulacion = $1 AND estado = 'pendiente' RETURNING *`,
      [idPostulacion],
    );
    if (!rows[0]) throw new PostulacionNoPendienteError();
    return mapPostulacion(rows[0])!;
  }

  /** Postulaciones de una vacante con el shape público del conductor (mismo patrón que viajes → PersonaParte, sin teléfono). */
  async listarPostulacionesDeVacante(idVacante: number): Promise<PostulacionConConductor[]> {
    const { rows } = await pool.query<PostulacionRow & {
      nombre_enc: string | null; apellido_paterno_enc: string | null; nombre: string | null; apellido_paterno: string | null;
      foto_perfil_url: string | null; calificacion: string | null;
    }>(
      `SELECT p.*,
              per.nombre_enc, per.apellido_paterno_enc, per.nombre, per.apellido_paterno,
              u.foto_perfil_url,
              (SELECT AVG(calificacion) FROM evaluaciones WHERE id_evaluado = u.id_usuario) AS calificacion
         FROM postulaciones p
         JOIN usuarios u ON u.id_usuario = p.id_conductor
         LEFT JOIN personas per ON per.id_persona = u.id_usuario
        WHERE p.id_vacante = $1
        ORDER BY p.id_postulacion DESC`,
      [idVacante],
    );
    return rows.map((r) => {
      const dec = cipherCodec.decodeDeRow('personas', {
        nombre_enc: r.nombre_enc, apellido_paterno_enc: r.apellido_paterno_enc,
      });
      const nombre = (dec.nombre as string | null) ?? r.nombre;
      const apellido = (dec.apellido_paterno as string | null) ?? r.apellido_paterno;
      return {
        ...mapPostulacion(r)!,
        conductor: {
          nombre: [nombre, apellido].filter(Boolean).join(' ') || null,
          calificacion: r.calificacion == null ? null : Math.round(Number(r.calificacion) * 10) / 10,
          fotoUrl: r.foto_perfil_url ?? null,
        },
      };
    });
  }

  async listarMisPostulaciones(idConductor: number): Promise<PostulacionConVacante[]> {
    const { rows } = await pool.query<PostulacionRow & {
      id_vehiculo: string | number; id_municipio: string | number; estado_vacante: 'abierta' | 'cerrada';
    }>(
      `SELECT p.*, v.id_vehiculo, v.id_municipio, v.estado AS estado_vacante
         FROM postulaciones p
         JOIN vacantes v ON v.id_vacante = p.id_vacante
        WHERE p.id_conductor = $1
        ORDER BY p.id_postulacion DESC`,
      [idConductor],
    );
    return rows.map((r) => ({
      ...mapPostulacion(r)!,
      idVehiculo: Number(r.id_vehiculo),
      idMunicipio: Number(r.id_municipio),
      estadoVacante: r.estado_vacante,
    }));
  }

  async aceptarPostulacion(args: { idPostulacion: number; idPropietario: number }): Promise<{
    postulacion: Postulacion; vacante: Vacante; rechazadosIdsConductor: number[];
  }> {
    return withTransaction(async (client) => {
      // 1) Lock de la postulación + su vacante en una sola vuelta (mismas filas que se van a mutar).
      const { rows } = await client.query<{
        id_postulacion: string | number; id_vacante: string | number; id_conductor: string | number;
        estado_postulacion: 'pendiente' | 'aceptada' | 'rechazada' | 'retirada';
        id_propietario: string | number; id_vehiculo: string | number; estado_vacante: 'abierta' | 'cerrada';
      }>(
        `SELECT p.id_postulacion, p.id_vacante, p.id_conductor, p.estado AS estado_postulacion,
                v.id_propietario, v.id_vehiculo, v.estado AS estado_vacante
           FROM postulaciones p
           JOIN vacantes v ON v.id_vacante = p.id_vacante
          WHERE p.id_postulacion = $1
          FOR UPDATE OF p, v`,
        [args.idPostulacion],
      );
      const row = rows[0];
      if (!row) throw new PostulacionNoEncontradaError();
      if (Number(row.id_propietario) !== args.idPropietario) throw new NoEsTuVacanteError();
      if (row.estado_postulacion !== 'pendiente') throw new PostulacionNoPendienteError();
      if (row.estado_vacante !== 'abierta') throw new VacanteCerradaError();

      const idVacante = Number(row.id_vacante);
      const idConductor = Number(row.id_conductor);
      const idVehiculo = Number(row.id_vehiculo);

      // 2) Asignación origen='bolsa' — reusa AsignacionPostgresRepository.asignar en el MISMO client.
      await this.asignaciones.asignar({ idVehiculo, idConductor, origen: 'bolsa' }, client);

      // 3) Acepta la elegida.
      const { rows: aceptRows } = await client.query<PostulacionRow>(
        `UPDATE postulaciones SET estado = 'aceptada' WHERE id_postulacion = $1 RETURNING *`,
        [args.idPostulacion],
      );

      // 4) Rechaza las demás pendientes de la vacante (RETURNING para notificarles después, fuera de la tx).
      const { rows: rechRows } = await client.query<{ id_conductor: string | number }>(
        `UPDATE postulaciones SET estado = 'rechazada'
          WHERE id_vacante = $1 AND estado = 'pendiente' AND id_postulacion <> $2
          RETURNING id_conductor`,
        [idVacante, args.idPostulacion],
      );

      // 5) Cierra la vacante.
      const { rows: vacRows } = await client.query<VacanteRow>(
        `UPDATE vacantes SET estado = 'cerrada' WHERE id_vacante = $1 RETURNING *`,
        [idVacante],
      );

      return {
        postulacion: mapPostulacion(aceptRows[0])!,
        vacante: mapVacante(vacRows[0])!,
        rechazadosIdsConductor: rechRows.map((r) => Number(r.id_conductor)),
      };
    });
  }
}
