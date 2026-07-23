import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as c from '../controllers/adminReportesController.js';

export const adminReportesRoutes: Router = Router();

adminReportesRoutes.use(authMiddleware, requireRole('admin'));

// Usuarios con reportes acumulados (conductores y pasajeros; tabla paginada del panel).
adminReportesRoutes.get('/reportes/usuarios', c.listarUsuariosReportadosController);
adminReportesRoutes.get('/reportes/usuarios/:id', c.detalleUsuarioReportadoController);
// Veto: desactiva la cuenta del usuario y revoca sus sesiones. (Aplica a cualquier rol.)
adminReportesRoutes.post('/reportes/usuarios/:id/vetar', c.vetarConductorController);
// Reactivación: revierte el veto (cuenta suspendida → activa).
adminReportesRoutes.post('/reportes/usuarios/:id/reactivar', c.reactivarConductorController);
