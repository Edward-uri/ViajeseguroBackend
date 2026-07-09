import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { IOtpRepository } from '../domain/repositories/IOtpRepository.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';
import type { PublicUser } from '../../users/domain/User.js';
import type { Rol } from '../../core/jwt.js';
import { rolPrincipal } from '../../core/jwt.js';
import { verificarCodigo, MAX_INTENTOS } from '../domain/otp.js';
import { OtpInvalidoError, CredencialesError } from '../domain/errors.js';
import { emitirTokens } from './sessionTokens.js';

export function verifyLogin(deps: {
  users: IUserRepository;
  otp: IOtpRepository;
  sessions: ISessionRepository;
}) {
  return async ({ correo, codigo, dispositivo }: { correo: string; codigo: string; dispositivo?: string | null }):
    Promise<{ accessToken: string; refreshToken: string; user: PublicUser; roles: Rol[] }> => {
    const row = await deps.otp.ultimoVigente(correo, 'login');
    if (!row || row.intentos >= MAX_INTENTOS) throw new OtpInvalidoError();
    if (!(await verificarCodigo(codigo, row.codigoHash))) {
      await deps.otp.incrementarIntentos(row.idCodigo);
      throw new OtpInvalidoError();
    }
    await deps.otp.marcarUsado(row.idCodigo);

    const user = await deps.users.findByCorreo(correo);
    if (!user || user.idUsuario === null) throw new CredencialesError();
    const roles = await deps.users.getRoles(user.idUsuario);
    const tokens = await emitirTokens(deps.sessions, user.idUsuario, roles, dispositivo ?? null);
    return { ...tokens, user: { ...user.toPublicJSON(), rol: rolPrincipal(roles) }, roles };
  };
}
