import bcrypt from 'bcryptjs';
import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';
import { verifyRefreshToken } from '../../core/jwt.js';
import { UnauthorizedError } from '../../core/errors.js';
import { emitirTokens } from './sessionTokens.js';

export function refreshSession(deps: { users: IUserRepository; sessions: ISessionRepository }) {
  return async ({ refreshToken }: { refreshToken: string }): Promise<{ accessToken: string; refreshToken: string }> => {
    const { sid, sub } = verifyRefreshToken(refreshToken);
    const sesion = await deps.sessions.buscarVigente(sid);
    if (!sesion || sesion.idUsuario !== sub) throw new UnauthorizedError('Sesión inválida');
    if (!(await bcrypt.compare(refreshToken, sesion.refreshHash))) throw new UnauthorizedError('Sesión inválida');

    await deps.sessions.revocar(sid);
    const user = await deps.users.findById(sub);
    if (!user || user.idUsuario === null) throw new UnauthorizedError('Sesión inválida');
    return emitirTokens(deps.sessions, user.idUsuario, user.rol, null);
  };
}
