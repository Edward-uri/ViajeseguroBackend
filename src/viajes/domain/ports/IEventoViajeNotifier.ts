import type { PublicViaje } from '../Viaje.js';
import type { EstadoViaje } from '../tipos.js';

export interface IEventoViajeNotifier {
  viajeSolicitado(viaje: PublicViaje): Promise<void>;
  viajeAceptado(viaje: PublicViaje): Promise<void>;
  cambioEstado(viaje: PublicViaje): Promise<void>;
  /** Avisa a los conductores del municipio que un viaje pendiente ya no está disponible. */
  viajeYaNoDisponible(idMunicipio: number, idViaje: number, idConductorExcluido?: number): Promise<void>;
  /** Notifica al pasajero un cambio de estado puntual (sin cargar el viaje completo). */
  cambioEstadoPasajero(idPasajero: number, idViaje: number, estado: EstadoViaje): Promise<void>;
  ubicacionConductor(args: { idViaje: number; idPasajero: number; lat: number; lng: number }): Promise<void>;
  /** Reenvía la ubicación del pasajero al conductor asignado. */
  ubicacionPasajero(args: { idViaje: number; idConductor: number; lat: number; lng: number }): Promise<void>;
}
