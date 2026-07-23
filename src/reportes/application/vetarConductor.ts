import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { ISessionRepository } from '../../auth/domain/repositories/ISessionRepository.js';
import type { IPushSender } from '../../viajes/domain/ports/IPushSender.js';

/** Veto admin de un conductor: suspende la cuenta y revoca sus sesiones activas
 *  (enforcement inmediato). Idempotente. El login ya rechaza cuentas suspendidas. */
export function vetarConductor(deps: {
  users: Pick<IUserRepository, 'suspenderCuenta'>;
  sessions: Pick<ISessionRepository, 'revocarTodasDeUsuario'>;
  push: IPushSender;
}) {
  return async (idConductor: number): Promise<void> => {
    await deps.users.suspenderCuenta(idConductor);
    await deps.sessions.revocarTodasDeUsuario(idConductor);
    // Aviso best-effort: el veto ya quedó aplicado pase lo que pase con el push.
    try {
      await deps.push.enviar({
        idUsuario: idConductor,
        titulo: 'Tu cuenta fue suspendida',
        cuerpo: 'Tu cuenta fue suspendida por reportes de pasajeros. Contacta a soporte para más información.',
        data: { tipo: 'cuenta_suspendida' },
      });
    } catch {
      // Best-effort.
    }
  };
}
