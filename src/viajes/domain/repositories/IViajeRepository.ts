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
  idConductor?: number;
  idVehiculo?: number;
  canceladoPor?: CanceladoPor;
  motivo?: string | null;
}

export interface IViajeRepository {
  crear(input: CrearViajeInput): Promise<Viaje>;
  porId(idViaje: number): Promise<Viaje | null>;
  listarPorPasajero(idPasajero: number): Promise<Viaje[]>;
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
}
