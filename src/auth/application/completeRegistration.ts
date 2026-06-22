import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';
import type { PublicUser } from '../../users/domain/User.js';
import { verifyRegistrationToken } from '../../core/jwt.js';
import { UserBuilder } from '../../users/domain/User.js';
import { PersonaBuilder } from '../../users/domain/Persona.js';
import { emitirTokens } from './sessionTokens.js';
import { hashPassword } from '../domain/password.js';

export interface CompleteRegistrationInput {
  registrationToken: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  telefono?: string | null;
  idSexo?: number | null;
  fechaNacimiento?: string | null;
  idMunicipio?: number | null;
  dispositivo?: string | null;
  password?: string | null;
}

export function completeRegistration(deps: { users: IUserRepository; sessions: ISessionRepository }) {
  return async (input: CompleteRegistrationInput): Promise<{ accessToken: string; refreshToken: string; user: PublicUser }> => {
    const { correo, rol } = verifyRegistrationToken(input.registrationToken);

    const user = new UserBuilder()
      .correoElectronico(correo)
      .telefono(input.telefono ?? null)
      .rol(rol)
      .correoVerificado(true)
      .idMunicipio(input.idMunicipio ?? null)
      .build();
    const persona = new PersonaBuilder()
      .nombre(input.nombre)
      .apellidoPaterno(input.apellidoPaterno)
      .apellidoMaterno(input.apellidoMaterno ?? null)
      .idSexo(input.idSexo ?? null)
      .fechaNacimiento(input.fechaNacimiento ?? null)
      .build();

    const passwordHash = input.password ? await hashPassword(input.password) : null;
    const creado = await deps.users.createUserWithPersona({ user, persona, passwordHash });
    const tokens = await emitirTokens(deps.sessions, creado.idUsuario!, creado.rol, input.dispositivo ?? null);
    return { ...tokens, user: creado.toPublicJSON() };
  };
}
