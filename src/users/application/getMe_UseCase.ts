import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { User } from '../domain/User.js';
import { UserNotFoundError } from '../domain/errors.js';

/**
 * Caso de uso: obtener el perfil del usuario autenticado.
 */
export class GetMe_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(idUsuario: number): Promise<User> {
    const user = await this.userRepository.findById(idUsuario);
    if (!user) throw new UserNotFoundError();
    return user;
  }
}
