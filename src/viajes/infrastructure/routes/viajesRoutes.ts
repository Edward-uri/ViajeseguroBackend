import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as c from '../controllers/viajesController.js';

/** Público: el tarifario del municipio. Montado en /api/municipios. */
export const tarifasRoutes: Router = Router();
tarifasRoutes.get('/:id/tarifas', c.getTarifarioController);

/** Registro de token FCM. Montado en /api/dispositivos. */
export const dispositivosRoutes: Router = Router();
dispositivosRoutes.post('/', authMiddleware, c.registrarDispositivoController);

/** Viajes. Montado en /api/viajes. */
export const viajesRoutes: Router = Router();
viajesRoutes.use(authMiddleware);

viajesRoutes.post('/', c.crearViajeController);
viajesRoutes.get('/mios', c.listarMisViajesController);
viajesRoutes.get('/:id', c.getViajeController);
viajesRoutes.post('/:id/cancelar', c.cancelarViajeController);
viajesRoutes.post('/:id/evaluacion', c.evaluarViajeController);

// Mínimo del conductor (el flujo completo del conductor es otro entregable).
viajesRoutes.post('/:id/aceptar', requireRole('conductor'), c.aceptarViajeController);
viajesRoutes.post('/:id/iniciar', requireRole('conductor'), c.iniciarViajeController);
viajesRoutes.post('/:id/completar', requireRole('conductor'), c.completarViajeController);
