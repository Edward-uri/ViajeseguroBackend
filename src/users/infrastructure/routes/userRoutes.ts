import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware.js';
import { getMeController } from '../controllers/getMeController.js';
import { presignProfilePhotoController } from '../controllers/presignProfilePhotoController.js';
import { confirmProfilePhotoController } from '../controllers/confirmProfilePhotoController.js';
import { deleteAccountController } from '../controllers/deleteAccountController.js';

export const userRoutes: Router = Router();

userRoutes.get('/me', authMiddleware, getMeController);
userRoutes.post('/me/photo/presign', authMiddleware, presignProfilePhotoController);
userRoutes.put('/me/photo/confirm', authMiddleware, confirmProfilePhotoController);
userRoutes.delete('/me', authMiddleware, deleteAccountController);
