import { pool, withTransaction } from '../../core/db.js';
import { Viaje } from '../domain/Viaje.js';
import { TransicionInvalidaError } from '../domain/errors.js';
import type { EstadoViaje, TipoServicio, CanceladoPor } from '../domain/tipos.js';
import type {
  IViajeRepository,
  CrearViajeInput,
  CambiarEstadoInput,
} from '../domain/repositories/IViajeRepository.js';

interface ViajeRow {
  id_viaje: string | number;
  id_pasajero: string | number;
  id_conductor: string | number | null;
  id_vehiculo: string | number | null;
  id_municipio: string | number;
  tipo_servicio: TipoServicio;
  origen_lat: string | null; origen_lng: string | null; origen_texto: string | null;
  destino_lat: string | null; destino_lng: string | null; destino_texto: string | null;
  id_zona_destino: string | number | null;
  distancia_km: string | null;
  num_pasajeros: string | number;
  tarifa: string;
  tarifa_estimada: boolean;
  estado: EstadoViaje;
  fecha_solicitud: Date | null;
  fecha_aceptacion: Date | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
  cancelado_por: CanceladoPor | null;
  motivo_cancelacion: string | null;
}

const num = (v: string | number | null): number | null => (v == null ? null : Number(v));

function mapViaje(row: ViajeRow | undefined): Viaje | null {
  if (!row) return null;
  return new Viaje({
    idViaje: Number(row.id_viaje),
    idPasajero: Number(row.id_pasajero),
    idConductor: row.id_conductor == null ? null : Number(row.id_conductor),
    idVehiculo: row.id_vehiculo == null ? null : Number(row.id_vehiculo),
    idMunicipio: Number(row.id_municipio),
    tipoServicio: row.tipo_servicio,
    origenLat: num(row.origen_lat), origenLng: num(row.origen_lng), origenTexto: row.origen_texto,
    destinoLat: num(row.destino_lat), destinoLng: num(row.destino_lng), destinoTexto: row.destino_texto,
    idZonaDestino: row.id_zona_destino == null ? null : Number(row.id_zona_destino),
    distanciaKm: num(row.distancia_km),
    numPasajeros: Number(row.num_pasajeros),
    tarifa: Number(row.tarifa),
    tarifaEstimada: row.tarifa_estimada,
    estado: row.estado,
    fechaSolicitud: row.fecha_solicitud,
    fechaAceptacion: row.fecha_aceptacion,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    canceladoPor: row.cancelado_por,
    motivoCancelacion: row.motivo_cancelacion,
  });
}

export class ViajePostgresRepository implements IViajeRepository {
  async crear(input: CrearViajeInput): Promise<Viaje> {
    return withTransaction(async (client) => {
      const { rows } = await client.query<ViajeRow>(
        `INSERT INTO viajes
           (id_pasajero, id_municipio, tipo_servicio, origen_lat, origen_lng, origen_texto,
            destino_lat, destino_lng, destino_texto, id_zona_destino, distancia_km, num_pasajeros, tarifa, tarifa_estimada)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING *`,
        [
          input.idPasajero, input.idMunicipio, input.tipoServicio ?? 'viaje',
          input.origen.lat, input.origen.lng, input.origen.texto ?? null,
          input.destino.lat, input.destino.lng, input.destino.texto ?? null,
          input.idZonaDestino, input.distanciaKm, input.numPasajeros, input.tarifa, input.tarifaEstimada,
        ],
      );
      const viaje = mapViaje(rows[0]);
      if (!viaje) throw new Error('No se pudo crear el viaje');
      await client.query('INSERT INTO viaje_estado_historial (id_viaje, estado) VALUES ($1, $2)', [viaje.id, 'solicitado']);
      return viaje;
    });
  }

  async porId(idViaje: number): Promise<Viaje | null> {
    const { rows } = await pool.query<ViajeRow>('SELECT * FROM viajes WHERE id_viaje = $1', [idViaje]);
    return mapViaje(rows[0]);
  }

  async listarPorPasajero(idPasajero: number): Promise<Viaje[]> {
    const { rows } = await pool.query<ViajeRow>(
      'SELECT * FROM viajes WHERE id_pasajero = $1 ORDER BY fecha_solicitud DESC',
      [idPasajero],
    );
    return rows.map((r) => mapViaje(r)!);
  }

  async cambiarEstado(input: CambiarEstadoInput): Promise<Viaje> {
    return withTransaction(async (client) => {
      const sets: string[] = ['estado = $2'];
      const params: unknown[] = [input.idViaje, input.nuevo];
      let i = 3;
      if (input.nuevo === 'aceptado') {
        sets.push('fecha_aceptacion = NOW()');
        if (input.idConductor != null) { sets.push(`id_conductor = $${i++}`); params.push(input.idConductor); }
        if (input.idVehiculo != null) { sets.push(`id_vehiculo = $${i++}`); params.push(input.idVehiculo); }
      } else if (input.nuevo === 'en_curso') {
        sets.push('fecha_inicio = NOW()');
      } else if (input.nuevo === 'completado') {
        sets.push('fecha_fin = NOW()');
      } else if (input.nuevo === 'cancelado') {
        if (input.canceladoPor) { sets.push(`cancelado_por = $${i++}`); params.push(input.canceladoPor); }
        sets.push(`motivo_cancelacion = $${i++}`); params.push(input.motivo ?? null);
      }
      const esperadoIdx = i++;
      params.push(input.esperado);
      // Guarda de estado: si otro proceso ya cambió el viaje, el UPDATE no matchea (rowCount 0).
      const { rows } = await client.query<ViajeRow>(
        `UPDATE viajes SET ${sets.join(', ')} WHERE id_viaje = $1 AND estado = $${esperadoIdx} RETURNING *`,
        params,
      );
      const viaje = mapViaje(rows[0]);
      if (!viaje) throw new TransicionInvalidaError(input.esperado, input.nuevo);
      await client.query('INSERT INTO viaje_estado_historial (id_viaje, estado) VALUES ($1, $2)', [input.idViaje, input.nuevo]);
      return viaje;
    });
  }

  async guardarUbicacion(idViaje: number, lat: number, lng: number): Promise<void> {
    await pool.query('INSERT INTO rastreo_ubicacion (id_viaje, lat, lng) VALUES ($1, $2, $3)', [idViaje, lat, lng]);
  }

  async crearEvaluacion(args: {
    idViaje: number; idEvaluador: number; idEvaluado: number;
    tipo: 'pasajero_a_conductor'; calificacion: number; comentario: string | null;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO evaluaciones (id_viaje, id_evaluador, id_evaluado, tipo, calificacion, comentario)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [args.idViaje, args.idEvaluador, args.idEvaluado, args.tipo, args.calificacion, args.comentario],
    );
  }

  async listarPendientesPorMunicipio(idMunicipio: number, idConductor: number): Promise<Viaje[]> {
    const { rows } = await pool.query<ViajeRow>(
      `SELECT v.* FROM viajes v
        WHERE v.estado='solicitado' AND v.id_municipio=$1
          AND NOT EXISTS (
            SELECT 1 FROM viaje_rechazos r
             WHERE r.id_viaje = v.id_viaje AND r.id_conductor = $2
          )
        ORDER BY v.fecha_solicitud ASC, v.id_viaje ASC`,
      [idMunicipio, idConductor],
    );
    return rows.map((r) => mapViaje(r)!);
  }

  async rechazar(idViaje: number, idConductor: number): Promise<void> {
    await pool.query(
      `INSERT INTO viaje_rechazos (id_viaje, id_conductor)
       VALUES ($1, $2)
       ON CONFLICT (id_viaje, id_conductor) DO NOTHING`,
      [idViaje, idConductor],
    );
  }

  async listarPorConductor(idConductor: number): Promise<Viaje[]> {
    const { rows } = await pool.query<ViajeRow>(
      'SELECT * FROM viajes WHERE id_conductor=$1 ORDER BY fecha_solicitud DESC, id_viaje DESC',
      [idConductor],
    );
    return rows.map((r) => mapViaje(r)!);
  }

  async conductorConViajeActivo(idConductor: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM viajes WHERE id_conductor=$1 AND estado IN ('aceptado','en_curso') LIMIT 1`,
      [idConductor],
    );
    return rowCount === 1;
  }

  async pasajeroConViajeActivo(idPasajero: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM viajes WHERE id_pasajero=$1 AND estado IN ('solicitado','aceptado','en_curso') LIMIT 1`,
      [idPasajero],
    );
    return rowCount === 1;
  }
}
