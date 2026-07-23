import type { Viaje } from '../Viaje.js';
import type { EstadoViaje, CanceladoPor, TipoServicio } from '../tipos.js';

export interface CrearViajeInput {
  idPasajero: number;
  idMunicipio: number;
  tipoServicio?: TipoServicio;
  origen: { lat: number; lng: number; texto?: string | null };
  destino: { lat: number; lng: number; texto?: string | null };
  idZonaDestino: number | null;
  distanciaKm: number | null;
  numPasajeros: number;
  tarifa: number;
  tarifaEstimada: boolean;
}

export interface CambiarEstadoInput {
  idViaje: number;
  nuevo: EstadoViaje;
  /** Estado actual esperado: el UPDATE solo aplica si coincide (cierra carreras de aceptación). */
  esperado: EstadoViaje;
  /** null al volver a 'solicitado' limpia el conductor/vehículo (re-pool). */
  idConductor?: number | null;
  idVehiculo?: number | null;
  canceladoPor?: CanceladoPor;
  motivo?: string | null;
}

/** Datos de la contraparte para mostrar en el detalle del viaje (ya descifrados). */
export interface PersonaParte {
  nombre: string | null;
  calificacion: number | null;
  telefono: string | null;
  fotoUrl: string | null;
}
export interface VehiculoParte {
  modelo: string | null;
  color: string | null;
  anio: number | null;
  placa: string | null;
}
export interface ViajePartes {
  pasajero: PersonaParte | null;
  conductor: PersonaParte | null;
  vehiculo: VehiculoParte | null;
}

export interface IViajeRepository {
  crear(input: CrearViajeInput): Promise<Viaje>;
  porId(idViaje: number): Promise<Viaje | null>;
  /** Contraparte (pasajero/conductor/vehículo) descifrada, para el detalle del viaje. */
  detalleDePartes(idPasajero: number, idConductor: number | null, idVehiculo: number | null): Promise<ViajePartes>;
  listarPorPasajero(idPasajero: number): Promise<Viaje[]>;
  /** Últimos destinos distintos del pasajero (accesos rápidos en la app). */
  destinosRecientes(idPasajero: number, limite: number): Promise<{ lat: number; lng: number; texto: string | null }[]>;
  /** El viaje activo del pasajero (solicitado/aceptado/en_curso), o null. */
  viajeActivoDePasajero(idPasajero: number): Promise<Viaje | null>;
  cambiarEstado(input: CambiarEstadoInput): Promise<Viaje>;
  guardarUbicacion(idViaje: number, lat: number, lng: number): Promise<void>;
  crearEvaluacion(args: {
    idViaje: number;
    idEvaluador: number;
    idEvaluado: number;
    tipo: 'pasajero_a_conductor' | 'conductor_a_pasajero';
    calificacion: number;
    comentario: string | null;
  }): Promise<void>;
  listarPendientesPorMunicipio(idMunicipio: number, idConductor: number): Promise<Viaje[]>;
  rechazar(idViaje: number, idConductor: number): Promise<void>;
  listarPorConductor(idConductor: number): Promise<Viaje[]>;
  /** Historial paginado del conductor con filtros opcionales (estado, rango de fecha). */
  listarHistorialConductor(args: {
    idConductor: number; limit: number; offset: number;
    estado?: string | null; desde?: string | null; hasta?: string | null;
  }): Promise<{ data: Viaje[]; total: number }>;
  /** ¿El conductor ya tiene un viaje aceptado o en curso? */
  conductorConViajeActivo(idConductor: number): Promise<boolean>;
  /** ¿Hay un viaje aceptado o en curso para este conductor o este vehículo? Usado por flotillas al revocar. */
  conductorOVehiculoConViajeActivo(idConductor: number, idVehiculo: number): Promise<boolean>;
  /** ¿El pasajero ya tiene un viaje solicitado, aceptado o en curso? */
  pasajeroConViajeActivo(idPasajero: number): Promise<boolean>;
  /** Cancela por sistema las solicitudes vencidas. Devuelve las afectadas. */
  expirarVencidos(): Promise<{ idViaje: number; idMunicipio: number; idPasajero: number }[]>;
}
