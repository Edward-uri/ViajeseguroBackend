import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as c from '../controllers/adminReportesController.js';

export const adminReportesRoutes: Router = Router();

adminReportesRoutes.use(authMiddleware, requireRole('admin'));

// Conductores con reportes acumulados (tabla paginada del panel).
adminReportesRoutes.get('/reportes/conductores', c.listarConductoresReportadosController);
adminReportesRoutes.get('/reportes/conductores/:id', c.detalleConductorReportadoController);
// Veto: desactiva la cuenta del conductor y revoca sus sesiones.
adminReportesRoutes.post('/reportes/conductores/:id/vetar', c.vetarConductorController);
