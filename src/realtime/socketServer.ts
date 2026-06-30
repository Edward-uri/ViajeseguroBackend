import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { verifyAccessToken } from '../core/jwt.js';
import { env } from '../core/env.js';
import { usuarioRoom, conductorRoom, municipioRoom } from './rooms.js';
import { ConductorUbicacionSchema } from './schemas.js';
import type {
  AppServer,
  AppSocket,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from './events.js';
import { viajeUseCases } from '../viajes/infrastructure/dependencies.js';
import { conductorUseCases } from '../conductores/infrastructure/dependencies.js';

export function createSocketServer(httpServer: HttpServer): AppServer {
  const io: AppServer = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    { cors: { origin: env.SOCKET_CORS_ORIGIN } },
  );

  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) return next(new Error('unauthorized'));
    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: AppSocket) => {
    const user = socket.data.user;
    void socket.join(usuarioRoom(user.sub));
    if (user.rol === 'conductor') void socket.join(conductorRoom(user.sub));

    socket.on('conductor:online', (payload, ack) => {
      void (async () => {
        if (user.rol !== 'conductor') return ack?.({ ok: false });
        // El municipio se deriva del servidor (su municipio operativo), no del cliente:
        // así el conductor siempre entra a SU room aunque la app mande un valor desactualizado.
        const municipio = await conductorUseCases.municipioOperativo(user.sub);
        if (municipio == null) return ack?.({ ok: false, error: 'sin_municipio' });
        const room = municipioRoom(municipio);
        void socket.join(room);
        socket.data.municipioRoom = room;
        ack?.({ ok: true, idMunicipio: municipio });
      })();
    });

    socket.on('conductor:offline', () => {
      const room = socket.data.municipioRoom;
      if (room) {
        void socket.leave(room);
        socket.data.municipioRoom = undefined;
      }
    });

    socket.on('conductor:ubicacion', (payload) => {
      const parsed = ConductorUbicacionSchema.safeParse(payload);
      if (user.rol !== 'conductor' || !parsed.success) return;
      void viajeUseCases.registrarUbicacion(parsed.data.idViaje, user.sub, parsed.data.lat, parsed.data.lng);
    });
  });

  return io;
}
