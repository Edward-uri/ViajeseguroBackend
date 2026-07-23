import { pool, withTransaction } from '../../core/db.js';
import { Viaje } from '../domain/Viaje.js';
import { TransicionInvalidaError, ConductorOcupadoError } from '../domain/errors.js';
import type { EstadoViaje, TipoServicio, CanceladoPor } from '../domain/tipos.js';
import { MINUTOS_EXPIRACION_SOLICITUD } from '../domain/tipos.js';
import type {
  IViajeRepository,
  CrearViajeInput,
  CambiarEstadoInput,
  ViajePartes,
  PersonaParte,
  VehiculoParte,
} from '../domain/repositories/IViajeRepository.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';

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
  expira_en: Date | null;
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
    expiraEn: row.expira_en,
  });
}

export class ViajePostgresRepository implements IViajeRepository {
  async crear(input: CrearViajeInput): Promise<Viaje> {
    return withTransaction(async (client) => {
      const { rows } = await client.query<ViajeRow>(
        `INSERT INTO viajes
           (id_pasajero, id_municipio, tipo_servicio, origen_lat, origen_lng, origen_texto,
            destino_lat, destino_lng, destino_texto, id_zona_destino, distancia_km, num_pasajeros, tarifa, tarifa_estimada, expira_en)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, NOW() + ($15 || ' minutes')::interval)
         RETURNING *`,
        [
          input.idPasajero, input.idMunicipio, input.tipoServicio ?? 'viaje',
          input.origen.lat, input.origen.lng, input.origen.texto ?? null,
          input.destino.lat, input.destino.lng, input.destino.texto ?? null,
          input.idZonaDestino, input.distanciaKm, input.numPasajeros, input.tarifa, input.tarifaEstimada,
          String(MINUTOS_EXPIRACION_SOLICITUD),
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

  /** Persona (nombre/teléfono/foto/calificación) descifrada, o null si no existe. */
  private async persona(idUsuario: number): Promise<PersonaParte | null> {
    const { rows } = await pool.query(
      `SELECT p.nombre, p.nombre_enc, p.apellido_paterno, p.apellido_paterno_enc,
              u.telefono, u.telefono_enc, u.foto_perfil_url, u.foto_perfil_s3_key,
              (SELECT AVG(calificacion) FROM evaluaciones WHERE id_evaluado = u.id_usuario) AS calificacion
         FROM usuarios u
         LEFT JOIN personas p ON p.id_persona = u.id_usuario
        WHERE u.id_usuario = $1`,
      [idUsuario],
    );
    const row = rows[0];
    if (!row) return null;
    const d = cipherCodec.decodeDeRow('personas', row) as Record<string, unknown>;
    const u = cipherCodec.decodeDeRow('usuarios', row) as Record<string, unknown>;
    const val = (dec: unknown, plano: unknown) => ((dec ?? plano) == null ? null : String(dec ?? plano));
    const nombre = val(d.nombre, row.nombre);
    const apellido = val(d.apellido_paterno, row.apellido_paterno);
    return {
      nombre: [nombre, apellido].filter(Boolean).join(' ') || null,
      telefono: val(u.telefono, row.telefono),
      // foto_perfil_url quedó legada en NULL al subir la foto al volumen; la URL
      // servible se deriva de la s3_key (GET /api/users/:id/photo), igual que en
      // userView. Sin esto el conductor nunca recibía la foto del pasajero.
      fotoUrl: (row.foto_perfil_s3_key ?? row.foto_perfil_url) ? `/api/users/${idUsuario}/photo` : null,
      calificacion: row.calificacion == null ? null : Math.round(Number(row.calificacion) * 10) / 10,
    };
  }

  async detalleDePartes(idPasajero: number, idConductor: number | null, idVehiculo: number | null): Promise<ViajePartes> {
    const [pas, con, veh] = await Promise.all([
      this.persona(idPasajero),
      idConductor == null ? Promise.resolve(null) : this.persona(idConductor),
      idVehiculo == null ? Promise.resolve(null) : this.vehiculo(idVehiculo),
    ]);
    return { pasajero: pas, conductor: con, vehiculo: veh };
  }

  private async vehiculo(idVehiculo: number): Promise<VehiculoParte | null> {
    const { rows } = await pool.query(
      'SELECT modelo, color, anio, placa, placa_enc FROM vehiculos WHERE id_vehiculo = $1',
      [idVehiculo],
    );
    const row = rows[0];
    if (!row) return null;
    const d = cipherCodec.decodeDeRow('vehiculos', row) as Record<string, unknown>;
    const placa = (d.placa ?? row.placa) as string | null;
    return {
      modelo: row.modelo ?? null,
      color: row.color ?? null,
      anio: row.anio == null ? null : Number(row.anio),
      placa: placa == null ? null : String(placa),
    };
  }

  async listarPorPasajero(idPasajero: number): Promise<Viaje[]> {
    const { rows } = await pool.query<ViajeRow>(
      'SELECT * FROM viajes WHERE id_pasajero = $1 ORDER BY fecha_solicitud DESC',
      [idPasajero],
    );
    return rows.map((r) => mapViaje(r)!);
  }

  async destinosRecientes(idPasajero: number, limite: number): Promise<{ lat: number; lng: number; texto: string | null }[]> {
    const { rows } = await pool.query<{ lat: string; lng: string; texto: string | null }>(
      `SELECT destino_lat AS lat, destino_lng AS lng, destino_texto AS texto, MAX(fecha_solicitud) AS ultima
         FROM viajes
        WHERE id_pasajero = $1 AND destino_lat IS NOT NULL AND destino_lng IS NOT NULL
        GROUP BY destino_lat, destino_lng, destino_texto
        ORDER BY ultima DESC
        LIMIT $2`,
      [idPasajero, limite],
    );
    return rows.map((r) => ({ lat: Number(r.lat), lng: Number(r.lng), texto: r.texto }));
  }

  async viajeActivoDePasajero(idPasajero: number): Promise<Viaje | null> {
    const { rows } = await pool.query<ViajeRow>(
      `SELECT * FROM viajes
        WHERE id_pasajero = $1 AND estado IN ('solicitado','aceptado','en_curso')
        ORDER BY fecha_solicitud DESC
        LIMIT 1`,
      [idPasajero],
    );
    return mapViaje(rows[0]);
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
      } else if (input.nuevo === 'solicitado') {
        // Re-pool: el conductor suelta el viaje y vuelve a la lista sin conductor.
        if (input.idConductor === null) sets.push('id_conductor = NULL, id_vehiculo = NULL, fecha_aceptacion = NULL');
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
      let rows: ViajeRow[];
      try {
        ({ rows } = await client.query<ViajeRow>(
          `UPDATE viajes SET ${sets.join(', ')} WHERE id_viaje = $1 AND estado = $${esperadoIdx} RETURNING *`,
          params,
        ));
      } catch (e) {
        if (e instanceof Error && (e as { code?: string }).code === '23505'
            && String((e as { constraint?: string }).constraint).includes('uq_viaje_conductor_activo'))
          throw new ConductorOcupadoError();
        throw e;
      }
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
    tipo: 'pasajero_a_conductor' | 'conductor_a_pasajero'; calificacion: number; comentario: string | null;
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
          AND NOT EXISTS (
            SELECT 1 FROM reportes rp
             WHERE (rp.id_reportante = v.id_pasajero AND rp.id_reportado = $2)
                OR (rp.id_reportante = $2 AND rp.id_reportado = v.id_pasajero)
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

  async conductorOVehiculoConViajeActivo(idConductor: number, idVehiculo: number): Promise<boolean> {
    const { rows } = await pool.query(
      `SELECT EXISTS(SELECT 1 FROM viajes WHERE estado IN ('aceptado','en_curso') AND (id_conductor=$1 OR id_vehiculo=$2)) AS existe`,
      [idConductor, idVehiculo],
    );
    return rows[0].existe;
  }

  async pasajeroConViajeActivo(idPasajero: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      `SELECT 1 FROM viajes WHERE id_pasajero=$1 AND estado IN ('solicitado','aceptado','en_curso') LIMIT 1`,
      [idPasajero],
    );
    return rowCount === 1;
  }

  async expirarVencidos(): Promise<{ idViaje: number; idMunicipio: number; idPasajero: number }[]> {
    const { rows } = await pool.query<{ id_viaje: string | number; id_municipio: string | number; id_pasajero: string | number }>(
      `UPDATE viajes SET estado='cancelado', cancelado_por='sistema', motivo_cancelacion='Sin conductor disponible'
        WHERE estado='solicitado' AND expira_en IS NOT NULL AND expira_en < NOW()
        RETURNING id_viaje, id_municipio, id_pasajero`,
    );
    return rows.map((r) => ({ idViaje: Number(r.id_viaje), idMunicipio: Number(r.id_municipio), idPasajero: Number(r.id_pasajero) }));
  }
}
