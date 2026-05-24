import { Router } from 'express';
import { authMiddleware } from '../../../core/authMiddleware.js';
import { getMeController } from '../controllers/getMeController.js';

export const userRoutes: Router = Router();

userRoutes.get('/me', authMiddleware, getMeController);
