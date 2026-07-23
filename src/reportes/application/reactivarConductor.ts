import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';

/** Revierte un veto: reactiva la cuenta suspendida del conductor. Idempotente. */
export function reactivarConductor(deps: {
  users: Pick<IUserRepository, 'reactivarCuenta'>;
}) {
  return async (idConductor: number): Promise<void> => {
    await deps.users.reactivarCuenta(idConductor);
  };
}
