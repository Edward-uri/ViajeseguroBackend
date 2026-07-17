import { pool } from '../../core/db.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';
import { Conductor, ConductorBuilder } from '../domain/Conductor.js';
import type { IConductorRepository, ConductorPendiente } from '../domain/repositories/IConductorRepository.js';

/** Descifra un telefono guardado en usuarios.telefono_enc (con fallback al plano en transición). */
function descifrarTelefono(telEnc: string | null, telPlano: string | null): string | null {
  const dec = cipherCodec.decodeDeRow('usuarios', { telefono_enc: telEnc });
  return ((dec.telefono as string | null) ?? telPlano) ?? null;
}

/** Descifra y concatena "nombre apellido_paterno" desde personas (fallback al plano). */
function descifrarNombre(r: {
  nombre_enc: string | null; apellido_paterno_enc: string | null;
  nombre: string | null; apellido_paterno: string | null;
}): string {
  const dec = cipherCodec.decodeDeRow('personas', {
    nombre_enc: r.nombre_enc, apellido_paterno_enc: r.apellido_paterno_enc,
  });
  const n = ((dec.nombre as string | null) ?? r.nombre) ?? '';
  const a = ((dec.apellido_paterno as string | null) ?? r.apellido_paterno) ?? '';
  return `${n} ${a}`.trim();
}

function fechaToStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(v);
}

interface Row {
  id_conductor: string | number;
  id_municipio: string | number | null;
  licencia: string | null;
  licencia_fecha_expedicion: Date | string | null;
  licencia_fecha_vencimiento: Date | string | null;
}

function map(row: Row | undefined): Conductor | null {
  if (!row) return null;
  const dec = cipherCodec.decodeDeRow('conductores', row as unknown as Record<string, unknown>);
  return new ConductorBuilder()
    .idConductor(Number(row.id_conductor))
    .idMunicipio(row.id_municipio == null ? null : Number(row.id_municipio))
    .licencia((dec.licencia as string | null) ?? row.licencia)
    .licenciaFechaExpedicion(fechaToStr(row.licencia_fecha_expedicion))
    .licenciaFechaVencimiento(fechaToStr(row.licencia_fecha_vencimiento))
    .build();
}

export class ConductorPostgresRepository implements IConductorRepository {
  async asegurarExiste(idConductor: number): Promise<void> {
    // Hereda el municipio del usuario (se fija en el registro). Si no, el conductor
    // quedaría sin municipio operativo y no recibiría viajes.
    await pool.query(
      `INSERT INTO conductores (id_conductor, id_municipio)
       SELECT $1, id_municipio FROM usuarios WHERE id_usuario = $1
       ON CONFLICT (id_conductor) DO NOTHING`,
      [idConductor],
    );
  }

  /** Municipio operativo del conductor; si el suyo es null, cae al del usuario. */
  async municipioOperativo(idConductor: number): Promise<number | null> {
    const { rows } = await pool.query<{ municipio: string | number | null }>(
      `SELECT COALESCE(c.id_municipio, u.id_municipio) AS municipio
         FROM conductores c
         JOIN usuarios u ON u.id_usuario = c.id_conductor
        WHERE c.id_conductor = $1`,
      [idConductor],
    );
    const m = rows[0]?.municipio;
    return m == null ? null : Number(m);
  }

  async findById(idConductor: number): Promise<Conductor | null> {
    const { rows } = await pool.query<Row>('SELECT * FROM conductores WHERE id_conductor = $1', [idConductor]);
    return map(rows[0]);
  }

  async upsertLicencia(a: {
    idConductor: number; idMunicipio: number; licencia: string; fechaExpedicion: string; fechaVencimiento: string;
  }): Promise<Conductor> {
    const enc = cipherCodec.encodeParaInsert('conductores', { licencia: a.licencia });
    const { rows } = await pool.query<Row>(
      `INSERT INTO conductores (id_conductor, id_municipio, licencia_enc, licencia_bidx, licencia_fecha_expedicion, licencia_fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id_conductor) DO UPDATE SET
         id_municipio = EXCLUDED.id_municipio,
         licencia_enc = EXCLUDED.licencia_enc,
         licencia_bidx = EXCLUDED.licencia_bidx,
         licencia_fecha_expedicion = EXCLUDED.licencia_fecha_expedicion,
         licencia_fecha_vencimiento = EXCLUDED.licencia_fecha_vencimiento
       RETURNING *`,
      [a.idConductor, a.idMunicipio, enc.licencia_enc, enc.licencia_bidx, a.fechaExpedicion, a.fechaVencimiento],
    );
    return map(rows[0])!;
  }

  async registrarCambioEstatus(a: {
    idConductor: number; estatus: 'habilitado' | 'inhabilitado'; descripcion: string | null;
  }): Promise<void> {
    await pool.query(
      'INSERT INTO conductor_cambio_estatus (id_conductor, estatus, descripcion) VALUES ($1, $2, $3)',
      [a.idConductor, a.estatus, a.descripcion],
    );
  }

  async listarConPendientes(): Promise<ConductorPendiente[]> {
    const { rows } = await pool.query<{
      id_conductor: string | number;
      nombre_enc: string | null; apellido_paterno_enc: string | null; nombre: string | null; apellido_paterno: string | null;
      telefono_enc: string | null; telefono: string | null; pendientes: string | number;
    }>(
      `SELECT c.id_conductor,
              p.nombre_enc, p.apellido_paterno_enc, p.nombre, p.apellido_paterno,
              u.telefono_enc, u.telefono,
              COUNT(*) FILTER (WHERE d.estado = 'pendiente') AS pendientes
         FROM conductores c
         JOIN usuarios u ON u.id_usuario = c.id_conductor
         JOIN personas p ON p.id_persona = c.id_conductor
         JOIN documentos_conductor d ON d.id_conductor = c.id_conductor
        GROUP BY c.id_conductor, p.nombre_enc, p.apellido_paterno_enc, p.nombre, p.apellido_paterno, u.telefono_enc, u.telefono
       HAVING COUNT(*) FILTER (WHERE d.estado = 'pendiente') > 0
        ORDER BY c.id_conductor`,
    );
    return rows.map((r) => ({
      idConductor: Number(r.id_conductor),
      nombre: descifrarNombre(r),
      telefono: descifrarTelefono(r.telefono_enc, r.telefono) as string,
      documentosPendientes: Number(r.pendientes),
    }));
  }

  async listarTodos(): Promise<{
    idConductor: number; nombre: string; telefono: string | null;
    idMunicipio: number | null; municipio: string | null; idVehiculoActivo: number | null;
    docs: { tipo: string; estado: string }[];
  }[]> {
    const { rows } = await pool.query<{
      id_conductor: string | number;
      nombre_enc: string | null; apellido_paterno_enc: string | null; nombre: string | null; apellido_paterno: string | null;
      telefono_enc: string | null; telefono: string | null;
      id_municipio: string | number | null; municipio: string | null;
      id_vehiculo_activo: string | number | null; docs: { tipo: string; estado: string }[];
    }>(
      `SELECT c.id_conductor,
              p.nombre_enc, p.apellido_paterno_enc, p.nombre, p.apellido_paterno,
              u.telefono_enc, u.telefono,
              c.id_municipio, m.nombre AS municipio, c.id_vehiculo_activo,
              COALESCE(json_agg(json_build_object('tipo', d.tipo, 'estado', d.estado))
                       FILTER (WHERE d.id_documento IS NOT NULL), '[]') AS docs
         FROM conductores c
         JOIN usuarios u ON u.id_usuario = c.id_conductor
         JOIN personas p ON p.id_persona = c.id_conductor
         LEFT JOIN municipios m ON m.id_municipio = c.id_municipio
         LEFT JOIN documentos_conductor d ON d.id_conductor = c.id_conductor
        GROUP BY c.id_conductor, p.nombre_enc, p.apellido_paterno_enc, p.nombre, p.apellido_paterno,
                 u.telefono_enc, u.telefono, c.id_municipio, m.nombre, c.id_vehiculo_activo
        ORDER BY c.id_conductor`,
    );
    return rows.map((r) => ({
      idConductor: Number(r.id_conductor),
      nombre: descifrarNombre(r),
      telefono: descifrarTelefono(r.telefono_enc, r.telefono),
      idMunicipio: r.id_municipio == null ? null : Number(r.id_municipio),
      municipio: r.municipio,
      idVehiculoActivo: r.id_vehiculo_activo == null ? null : Number(r.id_vehiculo_activo),
      docs: r.docs,
    }));
  }

  async getVehiculoActivo(idConductor: number): Promise<number | null> {
    const { rows } = await pool.query<{ id_vehiculo_activo: string | null }>(
      'SELECT id_vehiculo_activo FROM conductores WHERE id_conductor = $1',
      [idConductor],
    );
    const v = rows[0]?.id_vehiculo_activo;
    return v == null ? null : Number(v);
  }

  async setVehiculoActivo(idConductor: number, idVehiculo: number | null): Promise<void> {
    await pool.query(
      'UPDATE conductores SET id_vehiculo_activo = $2 WHERE id_conductor = $1',
      [idConductor, idVehiculo],
    );
  }
}
