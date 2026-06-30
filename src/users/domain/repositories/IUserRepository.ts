import type { User } from '../User.js';
import type { Persona } from '../Persona.js';

export interface IUserRepository {
  createAdmin(
    args: { correo: string; passwordHash: string },
    client?: import('pg').PoolClient,
  ): Promise<User>;
  findByTelefono(telefono: string): Promise<User | null>;
  findByCorreo(correo: string): Promise<User | null>;
  findById(idUsuario: number): Promise<User | null>;

  createUserWithPersona(args: {
    user: User;
    persona: Persona;
    passwordHash?: string | null;
  }): Promise<User>;

  /** Guarda la key de la foto en el volumen y devuelve la key anterior (para borrarla). */
  updateProfilePhoto(args: {
    idUsuario: number;
    key: string;
  }): Promise<{ user: User; previousKey: string | null }>;

  softDeleteAndClearPhoto(idUsuario: number): Promise<{ previousKey: string | null }>;

  setPasswordHash(idUsuario: number, passwordHash: string): Promise<void>;
  passwordHashPorId(idUsuario: number): Promise<string | null>;

  actualizarPerfil(
    idUsuario: number,
    campos: {
      nombre?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string | null;
      idSexo?: number | null;
      fechaNacimiento?: string | null;
      telefono?: string;
    },
  ): Promise<User>;
}
