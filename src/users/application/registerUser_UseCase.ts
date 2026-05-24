import bcrypt from 'bcryptjs';
import { env } from '../../core/env.js';
import { User, type RolUsuario } from '../domain/User.js';
import { Persona } from '../domain/Persona.js';
import type { IUserRepository } from '../domain/IUserRepository.js';
import { UserAlreadyExistsError } from '../domain/errors.js';

export interface RegisterUserInput {
  nombreUsuario: string;
  password: string;
  rol: RolUsuario;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  idSexo?: number | null;
  correoElectronico: string;
  telefono?: string | null;
  fechaNacimiento?: string | null;
}

/**
 * Caso de uso: registrar un nuevo usuario.
 * Crea Usuario y Persona en una sola transaccion. Hashea password con bcrypt.
 */
export class RegisterUser_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<User> {
    if (await this.userRepository.findByUsername(input.nombreUsuario)) {
      throw new UserAlreadyExistsError('nombre de usuario');
    }
    if (await this.userRepository.findByCorreo(input.correoElectronico)) {
      throw new UserAlreadyExistsError('correo electronico');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    const user = new User({
      nombreUsuario: input.nombreUsuario,
      passwordHash,
      rol: input.rol,
    });

    const persona = new Persona({
      nombre: input.nombre,
      apellidoPaterno: input.apellidoPaterno,
      apellidoMaterno: input.apellidoMaterno ?? null,
      idSexo: input.idSexo ?? null,
      correoElectronico: input.correoElectronico,
      telefono: input.telefono ?? null,
      fechaNacimiento: input.fechaNacimiento ?? null,
    });

    return this.userRepository.createUserWithPersona({ user, persona });
  }
}
