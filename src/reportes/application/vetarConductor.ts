import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { ISessionRepository } from '../../auth/domain/repositories/ISessionRepository.js';

/** Veto admin de un conductor: suspende la cuenta y revoca sus sesiones activas
 *  (enforcement inmediato). Idempotente. El login ya rechaza cuentas suspendidas. */
export function vetarConductor(deps: {
  users: Pick<IUserRepository, 'suspenderCuenta'>;
  sessions: Pick<ISessionRepository, 'revocarTodasDeUsuario'>;
}) {
  return async (idConductor: number): Promise<void> => {
    await deps.users.suspenderCuenta(idConductor);
    await deps.sessions.revocarTodasDeUsuario(idConductor);
  };
}
