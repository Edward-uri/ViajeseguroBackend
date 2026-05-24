import { UserPostgresRepository } from './UserPostgresRepository.js';
import { RegisterUser_UseCase } from '../application/registerUser_UseCase.js';
import { LoginUser_UseCase } from '../application/loginUser_UseCase.js';
import { GetMe_UseCase } from '../application/getMe_UseCase.js';


const userRepository = new UserPostgresRepository();

export const registerUserUseCase = new RegisterUser_UseCase(userRepository);
export const loginUserUseCase = new LoginUser_UseCase(userRepository);
export const getMeUseCase = new GetMe_UseCase(userRepository);
