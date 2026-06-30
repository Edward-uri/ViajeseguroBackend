import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IDocumentStorage } from '../../core/storage.js';

export class DeleteAccount_UseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly storage: IDocumentStorage,
  ) {}

  async execute(idUsuario: number): Promise<void> {
    const { previousKey } = await this.userRepository.softDeleteAndClearPhoto(idUsuario);

    if (previousKey) {
      try {
        await this.storage.borrar(previousKey);
      } catch (err) {
        console.error('[WARN] No se pudo borrar la foto del usuario eliminado del volumen', {
          previousKey,
          err,
        });
      }
    }
  }
}
