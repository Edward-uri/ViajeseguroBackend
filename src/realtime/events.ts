import type { Server, Socket } from 'socket.io';
import type { PublicViaje } from '../viajes/domain/Viaje.js';
import type { EstadoViaje } from '../viajes/domain/tipos.js';
import type { AuthTokenPayload } from '../core/jwt.js';

export interface ServerToClientEvents {
  'viaje:solicitado': (viaje: PublicViaje) => void;
  'viaje:aceptado': (viaje: PublicViaje) => void;
  'viaje:cambio_estado': (payload: { idViaje: number; estado: EstadoViaje }) => void;
  'viaje:no_disponible': (payload: { idViaje: number }) => void;
  'viaje:ubicacion_conductor': (payload: { idViaje: number; lat: number; lng: number }) => void;
}

export interface ClientToServerEvents {
  'conductor:online': (payload: unknown, ack?: (res: { ok: boolean; idMunicipio?: number; error?: string }) => void) => void;
  'conductor:offline': () => void;
  'conductor:ubicacion': (payload: unknown) => void;
}

export type InterServerEvents = Record<string, never>;

export interface SocketData {
  user: AuthTokenPayload;
  municipioRoom?: string;
}

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
