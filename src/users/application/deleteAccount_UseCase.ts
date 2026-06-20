import { deleteObject } from '../../infrastructure/s3.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';


export class DeleteAccount_UseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(idUsuario: number): Promise<void> {
    const { previousS3Key } = await this.userRepository.softDeleteAndClearPhoto(idUsuario);

    if (previousS3Key) {
      try {
        await deleteObject(previousS3Key);
      } catch (err) {
        console.error('[WARN] No se pudo borrar la foto del usuario eliminado en S3', {
          previousS3Key,
          err,
        });
      }
    }
  }
}
