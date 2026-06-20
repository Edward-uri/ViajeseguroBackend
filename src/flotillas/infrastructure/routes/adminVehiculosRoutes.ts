import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as a from '../controllers/adminVehiculosController.js';

export const adminVehiculosRoutes: Router = Router();

adminVehiculosRoutes.use(authMiddleware, requireRole('admin'));
adminVehiculosRoutes.get('/vehiculos/pendientes', a.listPendientesController);
adminVehiculosRoutes.get('/vehiculos/:id', a.getVehiculoDetalleController);
adminVehiculosRoutes.get('/vehiculos/documentos/:id/archivo', a.getArchivoAdminController);
adminVehiculosRoutes.patch('/vehiculos/documentos/:id', a.reviewDocumentoController);
