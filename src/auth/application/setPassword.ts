import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import { hashPassword } from '../domain/password.js';

export function setPassword(deps: { users: IUserRepository }) {
  return async (idUsuario: number, password: string): Promise<void> => {
    await deps.users.setPasswordHash(idUsuario, await hashPassword(password));
  };
}
