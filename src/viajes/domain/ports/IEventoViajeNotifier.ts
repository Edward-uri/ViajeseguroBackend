import type { PublicViaje } from '../Viaje.js';

export interface IEventoViajeNotifier {
  viajeSolicitado(viaje: PublicViaje): Promise<void>;
  viajeAceptado(viaje: PublicViaje): Promise<void>;
  cambioEstado(viaje: PublicViaje): Promise<void>;
  ubicacionConductor(args: { idViaje: number; idPasajero: number; lat: number; lng: number }): Promise<void>;
}
