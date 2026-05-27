import bcrypt from 'bcryptjs';
import { env } from '../../core/env.js';
import { signToken } from '../../core/jwt.js';
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

export interface RegisterUserOutput {
  user: User;
  token: string;
}

/**
 * Caso de uso: registrar un nuevo usuario.
 * Crea Usuario y Persona en una sola transaccion, hashea password con bcrypt
 * y firma un JWT para que el usuario quede logueado de una vez (sin necesidad
 * de llamar /login despues).
 */
export class RegisterUser_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
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

    const created = await this.userRepository.createUserWithPersona({ user, persona });

    if (created.idUsuario === null) {
      // No deberia pasar nunca — createUserWithPersona devuelve el id asignado.
      throw new Error('Usuario creado sin idUsuario asignado');
    }

    const token = signToken({ sub: created.idUsuario, rol: created.rol });
    return { user: created, token };
  }
}
