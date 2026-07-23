import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { IPushSender } from '../../viajes/domain/ports/IPushSender.js';

/** Revierte un veto: reactiva la cuenta suspendida del conductor. Idempotente. */
export function reactivarConductor(deps: {
  users: Pick<IUserRepository, 'reactivarCuenta'>;
  push: IPushSender;
}) {
  return async (idConductor: number): Promise<void> => {
    await deps.users.reactivarCuenta(idConductor);
    // Aviso best-effort: la reactivación ya quedó aplicada.
    try {
      await deps.push.enviar({
        idUsuario: idConductor,
        titulo: 'Tu cuenta fue reactivada',
        cuerpo: 'Tu cuenta está activa de nuevo. Ya puedes iniciar sesión y operar.',
        data: { tipo: 'cuenta_reactivada' },
      });
    } catch {
      // Best-effort.
    }
  };
}
