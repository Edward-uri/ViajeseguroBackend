import type { User } from '../User.js';
import type { Persona } from '../Persona.js';
import type { Rol } from '../../../core/jwt.js';

/** Datos personales descifrados de un usuario (bloque `persona` de /api/users/me). */
export interface PersonaPerfil {
  nombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  fechaNacimiento: string | null;
  /** FK a catalogo_sexo — es lo que se envía de vuelta en PUT /users/me. */
  idSexo: number | null;
  /** Etiqueta legible del sexo (catalogo_sexo.sexo), p. ej. "Masculino". */
  sexo: string | null;
}

export interface IUserRepository {
  createAdmin(
    args: { correo: string; passwordHash: string },
    client?: import('pg').PoolClient,
  ): Promise<User>;
  findByTelefono(telefono: string): Promise<User | null>;
  findByCorreo(correo: string): Promise<User | null>;
  findById(idUsuario: number): Promise<User | null>;
  personaPorId(idUsuario: number): Promise<PersonaPerfil | null>;

  createUserWithPersona(args: {
    user: User;
    persona: Persona;
    passwordHash?: string | null;
    roles: Rol[];
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

  /** Roles del usuario desde usuario_roles (fuente de verdad, ≥1 por backfill). */
  getRoles(idUsuario: number): Promise<Rol[]>;
  /** Agrega un rol (idempotente). */
  addRol(idUsuario: number, rol: Rol): Promise<void>;

  /** Veto admin: marca la cuenta como suspendida (idempotente; no toca cuentas eliminadas). */
  suspenderCuenta(idUsuario: number): Promise<void>;
}
