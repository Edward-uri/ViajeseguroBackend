import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import { crearMunicipioController } from '../controllers/adminMunicipioController.js';

export const adminMunicipiosRoutes: Router = Router();
adminMunicipiosRoutes.use(authMiddleware, requireRole('admin'));
adminMunicipiosRoutes.post('/municipios', crearMunicipioController);
