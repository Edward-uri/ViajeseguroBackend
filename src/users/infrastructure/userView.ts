import type { User, PublicUser } from '../domain/User.js';

/**
 * Mapea un `User` de dominio a su representación pública para JSON.
 *
 * La foto de perfil se sirve desde el backend (volumen montado): si el usuario
 * tiene foto, `fotoPerfilUrl` apunta a `GET /api/users/:id/photo`. El cliente la
 * carga con su token. Si no hay foto, `fotoPerfilUrl` es null.
 */
export function toServingUserJSON(user: User): PublicUser {
  const base = user.toPublicJSON();
  const fotoPerfilUrl =
    user.fotoPerfilS3Key && user.idUsuario != null ? `/api/users/${user.idUsuario}/photo` : null;
  return { ...base, fotoPerfilUrl };
}
