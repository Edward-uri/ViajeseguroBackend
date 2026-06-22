import type { User } from '../User.js';
import type { Persona } from '../Persona.js';

export interface IUserRepository {
  findByTelefono(telefono: string): Promise<User | null>;
  findByCorreo(correo: string): Promise<User | null>;
  findById(idUsuario: number): Promise<User | null>;

  createUserWithPersona(args: {
    user: User;
    persona: Persona;
    passwordHash?: string | null;
  }): Promise<User>;

  updateProfilePhoto(args: {
    idUsuario: number;
    fotoPerfilUrl: string;
    fotoPerfilS3Key: string;
  }): Promise<{ user: User; previousS3Key: string | null }>;

  softDeleteAndClearPhoto(idUsuario: number): Promise<{ previousS3Key: string | null }>;

  setPasswordHash(idUsuario: number, passwordHash: string): Promise<void>;
  passwordHashPorId(idUsuario: number): Promise<string | null>;
}
