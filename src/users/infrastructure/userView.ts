import { getPresignedReadUrl } from '../../infrastructure/s3.js';
import type { User, PublicUser } from '../domain/User.js';

/**
 * Mapea un `User` de dominio a su representacion publica para JSON,
 * generando una URL pre-firmada de lectura para la foto de perfil si
 * existe.
 *
 * El bucket S3 es privado (no se puede hacer publico en Learner Lab),
 * por eso `fotoPerfilUrl` no puede ser una URL plana — el cliente recibe
 * una URL temporal firmada que vence en 1 hora. Cuando el cliente vuelva
 * a llamar a `/api/users/me` recibe una URL fresca.
 *
 * Esta funcion vive en la capa `infrastructure/` porque depende de S3;
 * la entity `User` se mantiene pura en domain/.
 */
export async function toServingUserJSON(user: User): Promise<PublicUser> {
  const base = user.toPublicJSON();
  if (!user.fotoPerfilS3Key) {
    // El user no tiene foto subida — devolvemos fotoPerfilUrl null.
    return { ...base, fotoPerfilUrl: null };
  }
  const url = await getPresignedReadUrl(user.fotoPerfilS3Key);
  return { ...base, fotoPerfilUrl: url };
}
