import bcrypt from 'bcryptjs';
import { env } from '../../core/env.js';
import { signAccessToken, signRefreshToken, type Rol } from '../../core/jwt.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';

const DIAS_REFRESH = 60;

export async function emitirTokens(
  sessions: ISessionRepository,
  idUsuario: number,
  roles: Rol[],
  idMunicipio: number | null,
  dispositivo: string | null,
): Promise<{ accessToken: string; refreshToken: string }> {
  if (roles.length === 0) {
    console.error(`[auth] usuario ${idUsuario} sin filas en usuario_roles al emitir tokens — integridad rota`);
  }
  const expiraEn = new Date(Date.now() + DIAS_REFRESH * 86_400_000);
  const placeholder = await bcrypt.hash('pending', env.BCRYPT_ROUNDS);
  const { idSesion } = await sessions.crear({ idUsuario, refreshHash: placeholder, dispositivo, expiraEn });
  const refreshToken = signRefreshToken({ sub: idUsuario, sid: idSesion });
  await sessions.actualizarHash(idSesion, await bcrypt.hash(refreshToken, env.BCRYPT_ROUNDS));
  return { accessToken: signAccessToken({ sub: idUsuario, roles, idMunicipio }), refreshToken };
}
