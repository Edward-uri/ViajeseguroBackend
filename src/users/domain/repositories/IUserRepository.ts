import type { User } from '../User.js';
import type { Persona } from '../Persona.js';

export interface IUserRepository {
  findByTelefono(telefono: string): Promise<User | null>;
  findByCorreo(correo: string): Promise<User | null>;
  findByIdentificador(identificador: string): Promise<User | null>;
  findById(idUsuario: number): Promise<User | null>;

  createUserWithPersona(args: { user: User; persona: Persona }): Promise<User>;

  updateProfilePhoto(args: {
    idUsuario: number;
    fotoPerfilUrl: string;
    fotoPerfilS3Key: string;
  }): Promise<{ user: User; previousS3Key: string | null }>;

  softDeleteAndClearPhoto(idUsuario: number): Promise<{ previousS3Key: string | null }>;
}
