import { pool } from '../../core/db.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';
import { Vehiculo, VehiculoBuilder } from '../domain/Vehiculo.js';
import type { IVehiculoRepository, VehiculoPendiente } from '../domain/repositories/IVehiculoRepository.js';

function descifrarTelefono(telEnc: string | null, telPlano: string | null): string | null {
  const dec = cipherCodec.decodeDeRow('usuarios', { telefono_enc: telEnc });
  return ((dec.telefono as string | null) ?? telPlano) ?? null;
}

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

interface Row {
  id_vehiculo: string | number;
  id_propietario: string | number;
  placa: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  id_municipio: string | number;
}

function map(row: Row | undefined): Vehiculo | null {
  if (!row) return null;
  const dec = cipherCodec.decodeDeRow('vehiculos', row as unknown as Record<string, unknown>);
  return new VehiculoBuilder()
    .idVehiculo(Number(row.id_vehiculo))
    .idPropietario(Number(row.id_propietario))
    .placa(((dec.placa as string | null) ?? row.placa) as string)
    .modelo(row.modelo)
    .color(row.color)
    .anio(row.anio == null ? null : Number(row.anio))
    .idMunicipio(Number(row.id_municipio))
    .build();
}

export class VehiculoPostgresRepository implements IVehiculoRepository {
  async crear(a: {
    idPropietario: number; placa: string; modelo: string | null; color: string | null; anio: number | null; idMunicipio: number;
  }): Promise<Vehiculo> {
    const enc = cipherCodec.encodeParaInsert('vehiculos', { placa: a.placa });
    const { rows } = await pool.query<Row>(
      `INSERT INTO vehiculos (id_propietario, placa_enc, placa_bidx, modelo, color, anio, id_municipio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [a.idPropietario, enc.placa_enc, enc.placa_bidx, a.modelo, a.color, a.anio, a.idMunicipio],
    );
    return map(rows[0])!;
  }

  async findById(idVehiculo: number): Promise<Vehiculo | null> {
    const { rows } = await pool.query<Row>('SELECT * FROM vehiculos WHERE id_vehiculo = $1', [idVehiculo]);
    return map(rows[0]);
  }

  async listarPorPropietario(idPropietario: number): Promise<Vehiculo[]> {
    const { rows } = await pool.query<Row>(
      'SELECT * FROM vehiculos WHERE id_propietario = $1 ORDER BY id_vehiculo',
      [idPropietario],
    );
    return rows.map((r) => map(r)!);
  }

  async actualizar(a: {
    idVehiculo: number; modelo: string | null; color: string | null; anio: number | null; idMunicipio: number;
  }): Promise<Vehiculo> {
    const { rows } = await pool.query<Row>(
      `UPDATE vehiculos
          SET modelo = $2, color = $3, anio = $4, id_municipio = $5
        WHERE id_vehiculo = $1
        RETURNING *`,
      [a.idVehiculo, a.modelo, a.color, a.anio, a.idMunicipio],
    );
    return map(rows[0])!;
  }

  async registrarCambioEstatus(a: { idVehiculo: number; estatus: 'activo' | 'inactivo'; descripcion: string | null }): Promise<void> {
    await pool.query(
      'INSERT INTO vehiculo_cambio_estatus (id_vehiculo, estatus, descripcion) VALUES ($1, $2, $3)',
      [a.idVehiculo, a.estatus, a.descripcion],
    );
  }

  async listarConPendientes(): Promise<VehiculoPendiente[]> {
    const { rows } = await pool.query<{
      id_vehiculo: string | number; placa_enc: string | null; placa: string | null;
      nombre_enc: string | null; apellido_paterno_enc: string | null; nombre: string | null; apellido_paterno: string | null;
      telefono_enc: string | null; telefono: string | null; pendientes: string | number;
    }>(
      `SELECT v.id_vehiculo,
              v.placa_enc, v.placa,
              p.nombre_enc, p.apellido_paterno_enc, p.nombre, p.apellido_paterno,
              u.telefono_enc, u.telefono,
              COUNT(*) FILTER (WHERE d.estado = 'pendiente') AS pendientes
         FROM vehiculos v
         JOIN usuarios u ON u.id_usuario = v.id_propietario
         JOIN personas p ON p.id_persona = v.id_propietario
         JOIN documentos_vehiculo d ON d.id_vehiculo = v.id_vehiculo
        GROUP BY v.id_vehiculo, v.placa_enc, v.placa, p.nombre_enc, p.apellido_paterno_enc, p.nombre, p.apellido_paterno, u.telefono_enc, u.telefono
       HAVING COUNT(*) FILTER (WHERE d.estado = 'pendiente') > 0
        ORDER BY v.id_vehiculo`,
    );
    return rows.map((r) => ({
      idVehiculo: Number(r.id_vehiculo),
      placa: ((cipherCodec.decodeDeRow('vehiculos', { placa_enc: r.placa_enc }).placa as string | null) ?? r.placa) as string,
      propietario: descifrarNombre(r),
      telefono: descifrarTelefono(r.telefono_enc, r.telefono) as string,
      documentosPendientes: Number(r.pendientes),
    }));
  }
}
