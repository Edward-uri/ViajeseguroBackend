import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { User } from '../domain/User.js';

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
  ): Promise<User> {
    return this.userRepository.actualizarPerfil(idUsuario, campos);
  }
}
