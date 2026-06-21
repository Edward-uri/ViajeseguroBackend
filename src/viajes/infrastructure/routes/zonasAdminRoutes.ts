import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as c from '../controllers/zonasAdminController.js';

export const zonasAdminRoutes: Router = Router();
zonasAdminRoutes.use(authMiddleware, requireRole('admin'));

zonasAdminRoutes.get('/municipios/:idMunicipio/zonas', c.listarZonasAdminController);
zonasAdminRoutes.post('/municipios/:idMunicipio/zonas', c.crearZonaController);
zonasAdminRoutes.patch('/municipios/:idMunicipio/zonas/:idZona', c.actualizarZonaController);
zonasAdminRoutes.delete('/municipios/:idMunicipio/zonas/:idZona', c.desactivarZonaController);
