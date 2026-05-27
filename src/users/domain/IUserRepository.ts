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

  /**
   * Actualiza la foto de perfil (URL publica + key en S3) y devuelve el User actualizado.
   * Si el usuario tenia foto anterior, devuelve tambien la key previa para que el use case decida si la borra de S3.
   */
  updateProfilePhoto(args: {
    idUsuario: number;
    fotoPerfilUrl: string;
    fotoPerfilS3Key: string;
  }): Promise<{ user: User; previousS3Key: string | null }>;

  /**
   * Soft-delete de la cuenta: marca estado_cuenta='eliminado' y limpia los campos de foto.
   * Devuelve la key previa de S3 (si existia) para que el use case la borre del bucket.
   */
  softDeleteAndClearPhoto(idUsuario: number): Promise<{ previousS3Key: string | null }>;
}
