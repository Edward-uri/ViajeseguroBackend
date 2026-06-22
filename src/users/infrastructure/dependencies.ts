import { UserPostgresRepository } from './UserPostgresRepository.js';
import { GetMe_UseCase } from '../application/getMe_UseCase.js';
import { PresignProfilePhotoUpload_UseCase } from '../application/presignProfilePhotoUpload_UseCase.js';
import { ConfirmProfilePhotoUpload_UseCase } from '../application/confirmProfilePhotoUpload_UseCase.js';
import { DeleteAccount_UseCase } from '../application/deleteAccount_UseCase.js';
import { EditarPerfil_UseCase } from '../application/editarPerfil_UseCase.js';


const userRepository = new UserPostgresRepository();

export const getMeUseCase = new GetMe_UseCase(userRepository);
export const presignProfilePhotoUploadUseCase = new PresignProfilePhotoUpload_UseCase();
export const confirmProfilePhotoUploadUseCase = new ConfirmProfilePhotoUpload_UseCase(userRepository);
export const deleteAccountUseCase = new DeleteAccount_UseCase(userRepository);
export const editarPerfilUseCase = new EditarPerfil_UseCase(userRepository);
