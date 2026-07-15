import type { IUserRepository, PersonaPerfil } from '../domain/repositories/IUserRepository.js';
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
  ): Promise<{ user: User; persona: PersonaPerfil | null; roles: Rol[] }> {
    const user = await this.userRepository.actualizarPerfil(idUsuario, campos);
    const persona = await this.userRepository.personaPorId(idUsuario);
    const roles = await this.userRepository.getRoles(idUsuario);
    return { user, persona, roles };
  }
}
