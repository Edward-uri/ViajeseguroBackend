import type { User } from './User.js';
import type { Persona } from './Persona.js';


export interface IUserRepository {
  findByUsername(nombreUsuario: string): Promise<User | null>;
  findByCorreo(correo: string): Promise<User | null>;
  /** Busca por nombre de usuario o correo electronico (lo que coincida primero). */
  findByUsernameOrCorreo(identifier: string): Promise<User | null>;
  findById(idUsuario: number): Promise<User | null>;

  /**
   * Crea usuario + persona en una sola transaccion (id compartido).
   * Devuelve el User ya con idUsuario asignado.
   */
  createUserWithPersona(args: { user: User; persona: Persona }): Promise<User>;
}
