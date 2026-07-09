import { randomUUID } from 'node:crypto';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IDocumentStorage } from '../../core/storage.js';
import { MIME_PERMITIDOS } from '../../core/storage.js';
import type { User } from '../domain/User.js';
import type { Rol } from '../../core/jwt.js';
import { ValidationError } from '../../core/errors.js';

/**
 * Sube la foto de perfil al volumen montado (mismo storage que los documentos).
 * Reemplaza el flujo previo de S3 (presign/confirm).
 */
export function uploadProfilePhoto(deps: { users: IUserRepository; storage: IDocumentStorage }) {
  return async (input: { idUsuario: number; contenido: Buffer; mimeType: string }): Promise<{ user: User; roles: Rol[] }> => {
    const ext = MIME_PERMITIDOS[input.mimeType];
    if (!ext || !input.mimeType.startsWith('image/') || input.contenido.length === 0) {
      throw new ValidationError('Imagen inválida (solo jpeg, png o webp)');
    }

    const key = `users/${input.idUsuario}/profile-${randomUUID()}${ext}`;
    await deps.storage.guardar({ key, contenido: input.contenido });

    const { user, previousKey } = await deps.users.updateProfilePhoto({ idUsuario: input.idUsuario, key });

    if (previousKey && previousKey !== key) {
      try { await deps.storage.borrar(previousKey); } catch { /* archivo huérfano: no crítico */ }
    }
    const roles = await deps.users.getRoles(input.idUsuario);
    return { user, roles };
  };
}
