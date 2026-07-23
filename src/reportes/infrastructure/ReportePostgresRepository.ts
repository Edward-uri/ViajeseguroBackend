import { pool } from '../../core/db.js';
import type {
  IReporteRepository, UsuarioReportado, DetalleUsuarioReportado, ReporteConReportante,
} from '../domain/repositories/IReporteRepository.js';
import type { Reporte, RolReportado } from '../domain/Reporte.js';
import { YaReportadoError } from '../domain/errors.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';

/** Nombre completo descifrado de una fila con columnas per.* (o null). */
function nombreDeRow(r: {
  nombre_enc: string | null; apellido_paterno_enc: string | null;
  nombre: string | null; apellido_paterno: string | null;
}): string | null {
  const dec = cipherCodec.decodeDeRow('personas', {
    nombre_enc: r.nombre_enc, apellido_paterno_enc: r.apellido_paterno_enc,
  });
  const nombre = (dec.nombre as string | null) ?? r.nombre;
  const apellido = (dec.apellido_paterno as string | null) ?? r.apellido_paterno;
  return [nombre, apellido].filter(Boolean).join(' ') || null;
}

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

  async listarUsuariosConReportes(args: { limit: number; offset: number }): Promise<{
    data: UsuarioReportado[]; total: number;
  }> {
    // Total = número de pares (usuario, rol) con al menos un reporte.
    const { rows: totalRows } = await pool.query<{ total: string | number }>(
      `SELECT COUNT(*)::int AS total
         FROM (SELECT 1 FROM reportes GROUP BY id_reportado, rol_reportado) t`,
    );
    const total = Number(totalRows[0]?.total ?? 0);

    const { rows } = await pool.query<{
      id_usuario: string | number; rol_reportado: RolReportado;
      conteo: string | number; ultimo: Date | string | null;
      estado_cuenta: string;
      nombre_enc: string | null; apellido_paterno_enc: string | null;
      nombre: string | null; apellido_paterno: string | null;
    }>(
      `SELECT r.id_reportado AS id_usuario, r.rol_reportado,
              COUNT(*)::int AS conteo,
              MAX(r.creado_en) AS ultimo,
              u.estado_cuenta,
              per.nombre_enc, per.apellido_paterno_enc, per.nombre, per.apellido_paterno
         FROM reportes r
         JOIN usuarios u ON u.id_usuario = r.id_reportado
         LEFT JOIN personas per ON per.id_persona = r.id_reportado
        GROUP BY r.id_reportado, r.rol_reportado, u.estado_cuenta,
                 per.nombre_enc, per.apellido_paterno_enc, per.nombre, per.apellido_paterno
        ORDER BY conteo DESC, ultimo DESC
        LIMIT $1 OFFSET $2`,
      [args.limit, args.offset],
    );

    const data: UsuarioReportado[] = rows.map((r) => ({
      idUsuario: Number(r.id_usuario),
      rol: r.rol_reportado,
      nombre: nombreDeRow(r),
      conteo: Number(r.conteo),
      ultimoReporte: r.ultimo == null ? null : new Date(r.ultimo),
      estadoCuenta: r.estado_cuenta,
    }));
    return { data, total };
  }

  async detalleUsuarioReportado(idUsuario: number, rol: RolReportado): Promise<DetalleUsuarioReportado | null> {
    const { rows: uRows } = await pool.query<{
      estado_cuenta: string; telefono: string | null; telefono_enc: string | null;
      correo_electronico: string | null; correo_electronico_enc: string | null;
      nombre_enc: string | null; apellido_paterno_enc: string | null;
      nombre: string | null; apellido_paterno: string | null;
    }>(
      `SELECT u.estado_cuenta, u.telefono, u.telefono_enc,
              u.correo_electronico, u.correo_electronico_enc,
              per.nombre_enc, per.apellido_paterno_enc, per.nombre, per.apellido_paterno
         FROM usuarios u
         LEFT JOIN personas per ON per.id_persona = u.id_usuario
        WHERE u.id_usuario = $1`,
      [idUsuario],
    );
    const u = uRows[0];
    if (!u) return null;

    const cont = cipherCodec.decodeDeRow('usuarios', {
      telefono_enc: u.telefono_enc, correo_electronico_enc: u.correo_electronico_enc,
    });

    const { rows: rRows } = await pool.query<{
      id_reporte: string | number; id_viaje: string | number | null;
      id_reportante: string | number; motivo: string; comentario: string | null;
      creado_en: Date | string | null;
      nombre_enc: string | null; apellido_paterno_enc: string | null;
      nombre: string | null; apellido_paterno: string | null;
    }>(
      `SELECT r.id_reporte, r.id_viaje, r.id_reportante, r.motivo, r.comentario, r.creado_en,
              per.nombre_enc, per.apellido_paterno_enc, per.nombre, per.apellido_paterno
         FROM reportes r
         LEFT JOIN personas per ON per.id_persona = r.id_reportante
        WHERE r.id_reportado = $1 AND r.rol_reportado = $2
        ORDER BY r.creado_en DESC`,
      [idUsuario, rol],
    );

    const reportes: ReporteConReportante[] = rRows.map((r) => ({
      idReporte: Number(r.id_reporte),
      idViaje: r.id_viaje == null ? null : Number(r.id_viaje),
      idReportante: Number(r.id_reportante),
      reportanteNombre: nombreDeRow(r),
      motivo: r.motivo,
      comentario: r.comentario,
      creadoEn: r.creado_en == null ? null : new Date(r.creado_en),
    }));

    return {
      idUsuario,
      rol,
      nombre: nombreDeRow(u),
      telefono: ((cont.telefono as string | null) ?? u.telefono) ?? null,
      correo: ((cont.correo_electronico as string | null) ?? u.correo_electronico) ?? null,
      estadoCuenta: u.estado_cuenta,
      conteo: reportes.length,
      reportes,
    };
  }
}
