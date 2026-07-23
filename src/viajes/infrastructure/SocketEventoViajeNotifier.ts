import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { PublicViaje } from '../domain/Viaje.js';
import type { EstadoViaje } from '../domain/tipos.js';
import type { AppServer } from '../../realtime/events.js';
import { usuarioRoom, conductorRoom, municipioRoom } from '../../realtime/rooms.js';

export class SocketEventoViajeNotifier implements IEventoViajeNotifier {
  private io: AppServer | null = null;

  attach(io: AppServer): void {
    this.io = io;
  }

  async viajeSolicitado(v: PublicViaje, conductoresExcluidos: number[] = []): Promise<void> {
    // Bloqueo (capa 1): no difundir a los conductores bloqueados con el pasajero.
    let target = this.io?.to(municipioRoom(v.idMunicipio));
    for (const id of conductoresExcluidos) target = target?.except(conductorRoom(id));
    target?.emit('viaje:solicitado', v);
  }

  async viajeAceptado(v: PublicViaje): Promise<void> {
    this.io?.to(usuarioRoom(v.idPasajero)).emit('viaje:aceptado', v);
  }

  async cambioEstado(v: PublicViaje): Promise<void> {
    const payload = { idViaje: v.idViaje, estado: v.estado };
    this.io?.to(usuarioRoom(v.idPasajero)).emit('viaje:cambio_estado', payload);
    if (v.idConductor != null) this.io?.to(conductorRoom(v.idConductor)).emit('viaje:cambio_estado', payload);
  }

  async viajeYaNoDisponible(idMunicipio: number, idViaje: number, idConductorExcluido?: number): Promise<void> {
    let target = this.io?.to(municipioRoom(idMunicipio));
    if (idConductorExcluido != null) target = target?.except(conductorRoom(idConductorExcluido));
    target?.emit('viaje:no_disponible', { idViaje });
  }

  async cambioEstadoPasajero(idPasajero: number, idViaje: number, estado: EstadoViaje): Promise<void> {
    this.io?.to(usuarioRoom(idPasajero)).emit('viaje:cambio_estado', { idViaje, estado });
  }

  async ubicacionConductor(args: { idViaje: number; idPasajero: number; lat: number; lng: number }): Promise<void> {
    this.io?.to(usuarioRoom(args.idPasajero)).emit('viaje:ubicacion_conductor', { idViaje: args.idViaje, lat: args.lat, lng: args.lng });
  }

  async ubicacionPasajero(args: { idViaje: number; idConductor: number; lat: number; lng: number }): Promise<void> {
    this.io?.to(conductorRoom(args.idConductor)).emit('viaje:ubicacion_pasajero', { idViaje: args.idViaje, lat: args.lat, lng: args.lng });
  }
}
