import type { PublicViaje } from '../domain/Viaje.js';
import type { EstadoViaje, Coordenada } from '../domain/tipos.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';

export class MockEventoViajeNotifier implements IEventoViajeNotifier {
  async viajeSolicitado(v: PublicViaje): Promise<void> { console.log(`[WS mock] viaje:solicitado ${v.idViaje} muni=${v.idMunicipio}`); }
  async viajeAceptado(v: PublicViaje): Promise<void> { console.log(`[WS mock] viaje:aceptado ${v.idViaje} -> pasajero ${v.idPasajero}`); }
  async cambioEstado(idViaje: number, estado: EstadoViaje): Promise<void> { console.log(`[WS mock] viaje:cambio_estado ${idViaje} -> ${estado}`); }
  async ubicacionConductor(idViaje: number, c: Coordenada): Promise<void> { console.log(`[WS mock] viaje:ubicacion ${idViaje} ${c.lat},${c.lng}`); }
}
