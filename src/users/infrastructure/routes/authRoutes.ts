import { Router } from 'express';
import { registerUserController } from '../controllers/registerUserController.js';
import { loginUserController } from '../controllers/loginUserController.js';

export const authRoutes: Router = Router();

authRoutes.post('/register', registerUserController);
authRoutes.post('/login', loginUserController);
