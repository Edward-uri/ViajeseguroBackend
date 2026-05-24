import bcrypt from 'bcryptjs';
import { signToken } from '../../core/jwt.js';
import type { IUserRepository } from '../domain/IUserRepository.js';
import type { User } from '../domain/User.js';
import { AccountNotActiveError, InvalidCredentialsError } from '../domain/errors.js';

export interface LoginUserInput {
  /** Puede ser nombre de usuario o correo electronico. */
  identifier: string;
  password: string;
}

export interface LoginUserOutput {
  user: User;
  token: string;
}

/**
 * Caso de uso: login con (username o correo) + password. Devuelve usuario y JWT firmado.
 * No revela si el fallo fue por usuario inexistente o por password incorrecta (siempre InvalidCredentialsError).
 */
export class LoginUser_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ identifier, password }: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepository.findByUsernameOrCorreo(identifier);
    if (!user) throw new InvalidCredentialsError();

    if (user.estadoCuenta !== 'activo') throw new AccountNotActiveError();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new InvalidCredentialsError();

    if (user.idUsuario === null) throw new InvalidCredentialsError();

    const token = signToken({ sub: user.idUsuario, rol: user.rol });
    return { user, token };
  }
}
