import { extname } from 'node:path';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IDocumentStorage } from '../../core/storage.js';
import { MIME_POR_EXT } from '../../core/storage.js';

/** Lee la foto de perfil del volumen. Devuelve null si el usuario no tiene foto. */
export function getProfilePhoto(deps: { users: IUserRepository; storage: IDocumentStorage }) {
  return async (idUsuario: number): Promise<{ contenido: Buffer; mimeType: string } | null> => {
    const user = await deps.users.findById(idUsuario);
    if (!user || !user.fotoPerfilS3Key) return null;
    const mimeType = MIME_POR_EXT[extname(user.fotoPerfilS3Key)] ?? 'application/octet-stream';
    const contenido = await deps.storage.leer(user.fotoPerfilS3Key);
    return { contenido, mimeType };
  };
}
