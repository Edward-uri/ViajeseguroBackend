import type { PublicViaje } from '../Viaje.js';
import type { EstadoViaje, Coordenada } from '../tipos.js';

export interface IEventoViajeNotifier {
  viajeSolicitado(viaje: PublicViaje): Promise<void>;
  viajeAceptado(viaje: PublicViaje): Promise<void>;
  cambioEstado(idViaje: number, estado: EstadoViaje): Promise<void>;
  ubicacionConductor(idViaje: number, coord: Coordenada): Promise<void>;
}
