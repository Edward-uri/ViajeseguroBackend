import { Router } from 'express';
import { authMiddleware } from '../../../middleware/authMiddleware.js';
import { reportarController } from '../controllers/reportesController.js';

export const reportesRoutes: Router = Router();

reportesRoutes.use(authMiddleware);

// Reportar a la contraparte de un viaje: POST /api/reportes { idViaje, motivo, comentario? }.
reportesRoutes.post('/', reportarController);
