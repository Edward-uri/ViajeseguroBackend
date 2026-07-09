import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';
import type { IInvitacionRepository } from '../domain/repositories/IInvitacionRepository.js';
import type { PublicUser } from '../../users/domain/User.js';
import type { Rol } from '../../core/jwt.js';
import { rolPrincipal } from '../../core/jwt.js';
import { withTransaction } from '../../core/db.js';
import { hashPassword } from '../domain/password.js';
import { hashToken } from '../domain/inviteToken.js';
import { InvitacionInvalidaError } from '../domain/errors.js';
import { emitirTokens } from './sessionTokens.js';

export function aceptarInvitacion(deps: {
  users: IUserRepository;
  invitaciones: IInvitacionRepository;
  sessions: ISessionRepository;
}) {
  return async ({ token, password, dispositivo }:
    { token: string; password: string; dispositivo?: string | null }):
    Promise<{ accessToken: string; refreshToken: string; user: PublicUser; roles: Rol[] }> => {
    const inv = await deps.invitaciones.porTokenHashVigente(hashToken(token));
    if (!inv) throw new InvitacionInvalidaError();

    const passwordHash = await hashPassword(password);

    // createAdmin puede lanzar CorreoYaRegistradoError (409) si el correo fue tomado en la carrera.
    const user = await withTransaction(async (client) => {
      const u = await deps.users.createAdmin({ correo: inv.correo, passwordHash }, client);
      await deps.invitaciones.marcarAceptada(inv.idInvitacion, client);
      return u;
    });

    if (user.idUsuario === null) throw new Error('admin creado sin id');
    const roles: Rol[] = ['admin'];
    const tokens = await emitirTokens(deps.sessions, user.idUsuario, roles, dispositivo ?? null);
    return { ...tokens, user: { ...user.toPublicJSON(), rol: rolPrincipal(roles) }, roles };
  };
}
