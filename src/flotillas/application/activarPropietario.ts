import type { IPropietarioRepository } from '../domain/repositories/IPropietarioRepository.js';
import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';

/** Upgrade pasajero→propietario: idempotente, sin datos de entrada. */
export function activarPropietario(deps: { users: IUserRepository; propietarios: IPropietarioRepository }) {
  return async ({ idUsuario }: { idUsuario: number }): Promise<void> => {
    await deps.users.addRol(idUsuario, 'propietario');
    await deps.propietarios.asegurarExiste(idUsuario);
  };
}
