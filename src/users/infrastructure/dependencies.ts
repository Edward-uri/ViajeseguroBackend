import { UserPostgresRepository } from './UserPostgresRepository.js';
import { DireccionPostgresRepository } from './DireccionPostgresRepository.js';
import { listarDirecciones, crearDireccion, eliminarDireccion } from '../application/direcciones_UseCase.js';
import { LocalDocumentStorage } from '../../infrastructure/storage/LocalDocumentStorage.js';
import { GetMe_UseCase } from '../application/getMe_UseCase.js';
import { uploadProfilePhoto } from '../application/uploadProfilePhoto_UseCase.js';
import { getProfilePhoto } from '../application/getProfilePhoto_UseCase.js';
import { DeleteAccount_UseCase } from '../application/deleteAccount_UseCase.js';
import { EditarPerfil_UseCase } from '../application/editarPerfil_UseCase.js';

const userRepository = new UserPostgresRepository();
const storage = new LocalDocumentStorage();

export const getMeUseCase = new GetMe_UseCase(userRepository);
export const uploadProfilePhotoUseCase = uploadProfilePhoto({ users: userRepository, storage });
export const getProfilePhotoUseCase = getProfilePhoto({ users: userRepository, storage });
export const deleteAccountUseCase = new DeleteAccount_UseCase(userRepository, storage);
export const editarPerfilUseCase = new EditarPerfil_UseCase(userRepository);

const direccionRepository = new DireccionPostgresRepository();
export const direccionesUseCases = {
  listar: listarDirecciones({ direcciones: direccionRepository }),
  crear: crearDireccion({ direcciones: direccionRepository }),
  eliminar: eliminarDireccion({ direcciones: direccionRepository }),
};
