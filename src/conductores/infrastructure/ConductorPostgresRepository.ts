import { pool } from '../../core/db.js';
import { Conductor, ConductorBuilder } from '../domain/Conductor.js';
import type { IConductorRepository, ConductorPendiente } from '../domain/repositories/IConductorRepository.js';

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
  return new ConductorBuilder()
    .idConductor(Number(row.id_conductor))
    .idMunicipio(row.id_municipio == null ? null : Number(row.id_municipio))
    .licencia(row.licencia)
    .licenciaFechaExpedicion(fechaToStr(row.licencia_fecha_expedicion))
    .licenciaFechaVencimiento(fechaToStr(row.licencia_fecha_vencimiento))
    .build();
}

export class ConductorPostgresRepository implements IConductorRepository {
  async asegurarExiste(idConductor: number): Promise<void> {
    await pool.query(
      'INSERT INTO conductores (id_conductor) VALUES ($1) ON CONFLICT (id_conductor) DO NOTHING',
      [idConductor],
    );
  }

  async findById(idConductor: number): Promise<Conductor | null> {
    const { rows } = await pool.query<Row>('SELECT * FROM conductores WHERE id_conductor = $1', [idConductor]);
    return map(rows[0]);
  }

  async upsertLicencia(a: {
    idConductor: number; idMunicipio: number; licencia: string; fechaExpedicion: string; fechaVencimiento: string;
  }): Promise<Conductor> {
    const { rows } = await pool.query<Row>(
      `INSERT INTO conductores (id_conductor, id_municipio, licencia, licencia_fecha_expedicion, licencia_fecha_vencimiento)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_conductor) DO UPDATE SET
         id_municipio = EXCLUDED.id_municipio,
         licencia = EXCLUDED.licencia,
         licencia_fecha_expedicion = EXCLUDED.licencia_fecha_expedicion,
         licencia_fecha_vencimiento = EXCLUDED.licencia_fecha_vencimiento
       RETURNING *`,
      [a.idConductor, a.idMunicipio, a.licencia, a.fechaExpedicion, a.fechaVencimiento],
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
    const { rows } = await pool.query<{ id_conductor: string | number; nombre: string; telefono: string; pendientes: string | number }>(
      `SELECT c.id_conductor,
              p.nombre || ' ' || p.apellido_paterno AS nombre,
              u.telefono,
              COUNT(*) FILTER (WHERE d.estado = 'pendiente') AS pendientes
         FROM conductores c
         JOIN usuarios u ON u.id_usuario = c.id_conductor
         JOIN personas p ON p.id_persona = c.id_conductor
         JOIN documentos_conductor d ON d.id_conductor = c.id_conductor
        GROUP BY c.id_conductor, p.nombre, p.apellido_paterno, u.telefono
       HAVING COUNT(*) FILTER (WHERE d.estado = 'pendiente') > 0
        ORDER BY c.id_conductor`,
    );
    return rows.map((r) => ({
      idConductor: Number(r.id_conductor),
      nombre: r.nombre,
      telefono: r.telefono,
      documentosPendientes: Number(r.pendientes),
    }));
  }
}
