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

export interface IViajeRepository {
  crear(input: CrearViajeInput): Promise<Viaje>;
  porId(idViaje: number): Promise<Viaje | null>;
  listarPorPasajero(idPasajero: number): Promise<Viaje[]>;
  /** El viaje activo del pasajero (solicitado/aceptado/en_curso), o null. */
  viajeActivoDePasajero(idPasajero: number): Promise<Viaje | null>;
  cambiarEstado(input: CambiarEstadoInput): Promise<Viaje>;
  guardarUbicacion(idViaje: number, lat: number, lng: number): Promise<void>;
  crearEvaluacion(args: {
    idViaje: number;
    idEvaluador: number;
    idEvaluado: number;
    tipo: 'pasajero_a_conductor';
    calificacion: number;
    comentario: string | null;
  }): Promise<void>;
  listarPendientesPorMunicipio(idMunicipio: number, idConductor: number): Promise<Viaje[]>;
  rechazar(idViaje: number, idConductor: number): Promise<void>;
  listarPorConductor(idConductor: number): Promise<Viaje[]>;
  /** ¿El conductor ya tiene un viaje aceptado o en curso? */
  conductorConViajeActivo(idConductor: number): Promise<boolean>;
  /** ¿El pasajero ya tiene un viaje solicitado, aceptado o en curso? */
  pasajeroConViajeActivo(idPasajero: number): Promise<boolean>;
  /** Cancela por sistema las solicitudes vencidas. Devuelve las afectadas. */
  expirarVencidos(): Promise<{ idViaje: number; idMunicipio: number; idPasajero: number }[]>;
}
