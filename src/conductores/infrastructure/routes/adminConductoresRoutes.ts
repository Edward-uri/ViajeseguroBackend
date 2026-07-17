import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as a from '../controllers/adminController.js';

export const adminConductoresRoutes: Router = Router();

adminConductoresRoutes.use(authMiddleware, requireRole('admin'));
adminConductoresRoutes.get('/conductores/pendientes', a.listPendientesController);
adminConductoresRoutes.get('/conductores', a.listTodosController);
adminConductoresRoutes.get('/conductores/:id', a.getConductorDetalleController);
adminConductoresRoutes.get('/documentos/:id/archivo', a.getArchivoAdminController);
adminConductoresRoutes.patch('/documentos/:id', a.reviewDocumentoController);
