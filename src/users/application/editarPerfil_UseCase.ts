import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { User } from '../domain/User.js';
import type { Rol } from '../../core/jwt.js';

export class EditarPerfil_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    idUsuario: number,
    campos: {
      nombre?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string | null;
      idSexo?: number | null;
      fechaNacimiento?: string | null;
      telefono?: string;
    },
  ): Promise<{ user: User; roles: Rol[] }> {
    const user = await this.userRepository.actualizarPerfil(idUsuario, campos);
    const roles = await this.userRepository.getRoles(idUsuario);
    return { user, roles };
  }
}
