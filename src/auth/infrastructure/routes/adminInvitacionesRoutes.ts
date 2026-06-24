import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as c from '../controllers/invitacionesController.js';

export const adminInvitacionesRoutes: Router = Router();

adminInvitacionesRoutes.use(authMiddleware, requireRole('admin'));
adminInvitacionesRoutes.post('/invitaciones', c.crearInvitacionController);
adminInvitacionesRoutes.get('/invitaciones', c.listarInvitacionesController);
adminInvitacionesRoutes.delete('/invitaciones/:id', c.revocarInvitacionController);
