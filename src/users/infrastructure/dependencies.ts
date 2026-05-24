import { UserPostgresRepository } from './UserPostgresRepository.js';
import { RegisterUser_UseCase } from '../application/registerUser_UseCase.js';
import { LoginUser_UseCase } from '../application/loginUser_UseCase.js';
import { GetMe_UseCase } from '../application/getMe_UseCase.js';
import { PresignProfilePhotoUpload_UseCase } from '../application/presignProfilePhotoUpload_UseCase.js';
import { ConfirmProfilePhotoUpload_UseCase } from '../application/confirmProfilePhotoUpload_UseCase.js';
import { DeleteAccount_UseCase } from '../application/deleteAccount_UseCase.js';


const userRepository = new UserPostgresRepository();

export const registerUserUseCase = new RegisterUser_UseCase(userRepository);
export const loginUserUseCase = new LoginUser_UseCase(userRepository);
export const getMeUseCase = new GetMe_UseCase(userRepository);
export const presignProfilePhotoUploadUseCase = new PresignProfilePhotoUpload_UseCase();
export const confirmProfilePhotoUploadUseCase = new ConfirmProfilePhotoUpload_UseCase(userRepository);
export const deleteAccountUseCase = new DeleteAccount_UseCase(userRepository);
