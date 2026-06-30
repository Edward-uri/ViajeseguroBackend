import type { PublicViaje } from '../Viaje.js';

export interface IEventoViajeNotifier {
  viajeSolicitado(viaje: PublicViaje): Promise<void>;
  viajeAceptado(viaje: PublicViaje): Promise<void>;
  cambioEstado(viaje: PublicViaje): Promise<void>;
  /** Avisa a los conductores del municipio que un viaje pendiente ya no está disponible. */
  viajeYaNoDisponible(idMunicipio: number, idViaje: number): Promise<void>;
  ubicacionConductor(args: { idViaje: number; idPasajero: number; lat: number; lng: number }): Promise<void>;
}
