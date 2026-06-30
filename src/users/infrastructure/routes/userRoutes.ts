import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware.js';
import { subirImagen } from '../../../infrastructure/storage/multerConfig.js';
import { getMeController } from '../controllers/getMeController.js';
import { uploadProfilePhotoController } from '../controllers/uploadProfilePhotoController.js';
import { getProfilePhotoController } from '../controllers/getProfilePhotoController.js';
import { deleteAccountController } from '../controllers/deleteAccountController.js';
import { editarPerfilController } from '../controllers/editarPerfilController.js';

export const userRoutes: Router = Router();

userRoutes.get('/me', authMiddleware, getMeController);
userRoutes.put('/me', authMiddleware, editarPerfilController);
userRoutes.put('/me/photo', authMiddleware, subirImagen.single('foto'), uploadProfilePhotoController);
userRoutes.get('/:id/photo', authMiddleware, getProfilePhotoController);
userRoutes.delete('/me', authMiddleware, deleteAccountController);
