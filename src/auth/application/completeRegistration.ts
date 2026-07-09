import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';
import type { IPropietarioRepository } from '../../flotillas/domain/repositories/IPropietarioRepository.js';
import type { PublicUser } from '../../users/domain/User.js';
import type { Rol } from '../../core/jwt.js';
import { verifyRegistrationToken, rolPrincipal } from '../../core/jwt.js';
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

export function completeRegistration(
  deps: { users: IUserRepository; sessions: ISessionRepository; propietarios: IPropietarioRepository },
) {
  return async (input: CompleteRegistrationInput): Promise<{ accessToken: string; refreshToken: string; user: PublicUser; roles: Rol[] }> => {
    const { correo, rol } = verifyRegistrationToken(input.registrationToken);
    // Parte 2: la app conductor registra propietarios (aunque la app vieja mande 'conductor').
    const esPropietario = rol === 'conductor' || rol === 'propietario';
    const roles: Rol[] = esPropietario ? ['propietario', 'pasajero'] : ['pasajero'];

    const user = new UserBuilder()
      .correoElectronico(correo)
      .telefono(input.telefono ?? null)
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
    const creado = await deps.users.createUserWithPersona({ user, persona, passwordHash, roles });

    if (esPropietario) {
      // Idempotente; si falla, flotillas se auto-repara en el primer uso (asegurarExiste) — no abortar el registro.
      try {
        await deps.propietarios.asegurarExiste(creado.idUsuario!);
      } catch (err) {
        console.error('[completeRegistration] no se pudo crear la fila propietarios', err);
      }
    }

    const tokens = await emitirTokens(deps.sessions, creado.idUsuario!, roles, input.dispositivo ?? null);
    return { ...tokens, user: { ...creado.toPublicJSON(), rol: rolPrincipal(roles) }, roles };
  };
}
