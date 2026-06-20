import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { verifyAccessToken } from '../core/jwt.js';
import { env } from '../core/env.js';
import { usuarioRoom, conductorRoom, municipioRoom } from './rooms.js';
import { ConductorOnlineSchema, ConductorUbicacionSchema } from './schemas.js';
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
        const parsed = ConductorOnlineSchema.safeParse(payload);
        if (user.rol !== 'conductor' || !parsed.success) return ack?.({ ok: false });
        // El municipio se deriva del servidor, no del cliente: solo puede unirse al suyo.
        const municipio = await conductorUseCases.municipioOperativo(user.sub);
        if (municipio == null || municipio !== parsed.data.idMunicipio) return ack?.({ ok: false });
        const room = municipioRoom(municipio);
        void socket.join(room);
        socket.data.municipioRoom = room;
        ack?.({ ok: true });
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
