import type { User, PublicUser } from '../domain/User.js';
import { rolPrincipal, type Rol } from '../../core/jwt.js';

/**
 * Mapea un `User` de dominio a su representación pública para JSON.
 *
 * La foto de perfil se sirve desde el backend (volumen montado): si el usuario
 * tiene foto, `fotoPerfilUrl` apunta a `GET /api/users/:id/photo`. El cliente la
 * carga con su token. Si no hay foto, `fotoPerfilUrl` es null.
 *
 * `rol` es derivado de `roles` (rolPrincipal) — ya no viene de la columna legacy.
 */
export function toServingUserJSON(user: User, roles: Rol[]): PublicUser & { roles: Rol[] } {
  const base = user.toPublicJSON();
  const fotoPerfilUrl =
    user.fotoPerfilS3Key && user.idUsuario != null ? `/api/users/${user.idUsuario}/photo` : null;
  return { ...base, rol: rolPrincipal(roles), roles, fotoPerfilUrl };
}
