import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { PublicViaje } from '../domain/Viaje.js';
import type { AppServer } from '../../realtime/events.js';
import { usuarioRoom, conductorRoom, municipioRoom } from '../../realtime/rooms.js';

export class SocketEventoViajeNotifier implements IEventoViajeNotifier {
  private io: AppServer | null = null;

  attach(io: AppServer): void {
    this.io = io;
  }

  async viajeSolicitado(v: PublicViaje): Promise<void> {
    this.io?.to(municipioRoom(v.idMunicipio)).emit('viaje:solicitado', v);
  }

  async viajeAceptado(v: PublicViaje): Promise<void> {
    this.io?.to(usuarioRoom(v.idPasajero)).emit('viaje:aceptado', v);
  }

  async cambioEstado(v: PublicViaje): Promise<void> {
    const payload = { idViaje: v.idViaje, estado: v.estado };
    this.io?.to(usuarioRoom(v.idPasajero)).emit('viaje:cambio_estado', payload);
    if (v.idConductor != null) this.io?.to(conductorRoom(v.idConductor)).emit('viaje:cambio_estado', payload);
  }

  async ubicacionConductor(args: { idViaje: number; idPasajero: number; lat: number; lng: number }): Promise<void> {
    this.io?.to(usuarioRoom(args.idPasajero)).emit('viaje:ubicacion_conductor', { idViaje: args.idViaje, lat: args.lat, lng: args.lng });
  }
}
