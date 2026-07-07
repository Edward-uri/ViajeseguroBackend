import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { User } from '../domain/User.js';
import { UserNotFoundError } from '../domain/errors.js';
import type { Rol } from '../../core/jwt.js';

export interface PersonaPerfil {
  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  fechaNacimiento: string | null;
}

/**
 * Caso de uso: obtener el perfil del usuario autenticado (con sus datos personales).
 */
export class GetMe_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    idUsuario: number,
  ): Promise<{ user: User; persona: PersonaPerfil | null; roles: Rol[] }> {
    const user = await this.userRepository.findById(idUsuario);
    if (!user) throw new UserNotFoundError();
    const persona = await this.userRepository.personaPorId(idUsuario);
    const roles = await this.userRepository.getRoles(idUsuario);
    return { user, persona, roles };
  }
}
