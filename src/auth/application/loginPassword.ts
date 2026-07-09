import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';
import type { PublicUser } from '../../users/domain/User.js';
import type { Rol } from '../../core/jwt.js';
import { rolPrincipal } from '../../core/jwt.js';
import { verifyPassword } from '../domain/password.js';
import { CredencialesError } from '../domain/errors.js';
import { emitirTokens } from './sessionTokens.js';

export function loginPassword(deps: { users: IUserRepository; sessions: ISessionRepository }) {
  return async ({ correo, password, dispositivo }: { correo: string; password: string; dispositivo?: string | null }):
    Promise<{ accessToken: string; refreshToken: string; user: PublicUser; roles: Rol[] }> => {
    const user = await deps.users.findByCorreo(correo);
    if (!user || user.idUsuario === null) throw new CredencialesError();
    const hash = await deps.users.passwordHashPorId(user.idUsuario);
    if (!hash || !(await verifyPassword(password, hash))) throw new CredencialesError();
    const roles = await deps.users.getRoles(user.idUsuario);
    const tokens = await emitirTokens(deps.sessions, user.idUsuario, roles, dispositivo ?? null);
    return { ...tokens, user: { ...user.toPublicJSON(), rol: rolPrincipal(roles) }, roles };
  };
}
