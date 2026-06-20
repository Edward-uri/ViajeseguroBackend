import { buildPublicUrl, deleteObject } from '../../infrastructure/s3.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { User } from '../domain/User.js';

export interface ConfirmProfilePhotoInput {
  idUsuario: number;
  s3Key: string;
}


export class ConfirmProfilePhotoUpload_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ idUsuario, s3Key }: ConfirmProfilePhotoInput): Promise<User> {
    const publicUrl = buildPublicUrl(s3Key);
    const { user, previousS3Key } = await this.userRepository.updateProfilePhoto({
      idUsuario,
      fotoPerfilUrl: publicUrl,
      fotoPerfilS3Key: s3Key,
    });

    if (previousS3Key && previousS3Key !== s3Key) {
      try {
        await deleteObject(previousS3Key);
      } catch (err) {
        console.error('[WARN] No se pudo borrar la foto previa de S3', { previousS3Key, err });
      }
    }

    return user;
  }
}
