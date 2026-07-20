import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as c from '../controllers/viajesController.js';

/** Público: el tarifario del municipio. Montado en /api/municipios. */
export const tarifasRoutes: Router = Router();
tarifasRoutes.get('/:id/tarifas', c.getTarifarioController);

/** Registro de token FCM. Montado en /api/dispositivos. */
export const dispositivosRoutes: Router = Router();
dispositivosRoutes.post('/', authMiddleware, c.registrarDispositivoController);

/** Etiquetas de reputación (top-3 inferidas por LLM-JALA). Montado en /api/usuarios. */
export const etiquetasRoutes: Router = Router();
etiquetasRoutes.get('/:id/etiquetas', authMiddleware, c.etiquetasDeUsuarioController);

/** Eventos de demanda (telemetría del pasajero). Montado en /api/eventos-demanda. */
export const eventosDemandaRoutes: Router = Router();
eventosDemandaRoutes.post('/', authMiddleware, c.registrarEventoDemandaController);

/** Viajes. Montado en /api/viajes. */
export const viajesRoutes: Router = Router();
viajesRoutes.use(authMiddleware);

viajesRoutes.post('/', c.crearViajeController);
viajesRoutes.post('/estimar', c.estimarViajeController);
viajesRoutes.get('/mios', c.listarMisViajesController);
viajesRoutes.get('/activo', c.getViajeActivoController);
viajesRoutes.get('/pendientes', requireRole('conductor'), c.listarPendientesController);
viajesRoutes.get('/asignados', requireRole('conductor'), c.listarAsignadosController);
viajesRoutes.get('/ruta', c.rutaController);
viajesRoutes.get('/destinos-recientes', c.destinosRecientesController);
viajesRoutes.get('/:id', c.getViajeController);
viajesRoutes.post('/:id/cancelar', c.cancelarViajeController);
viajesRoutes.post('/:id/evaluacion', c.evaluarViajeController);

// Mínimo del conductor (el flujo completo del conductor es otro entregable).
viajesRoutes.post('/:id/aceptar', requireRole('conductor'), c.aceptarViajeController);
viajesRoutes.post('/:id/soltar', requireRole('conductor'), c.soltarViajeController);
viajesRoutes.post('/:id/iniciar', requireRole('conductor'), c.iniciarViajeController);
viajesRoutes.post('/:id/completar', requireRole('conductor'), c.completarViajeController);
viajesRoutes.post('/:id/rechazar', requireRole('conductor'), c.rechazarViajeController);
