import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import * as c from '../controllers/bolsaController.js';

export const bolsaRoutes: Router = Router();

bolsaRoutes.use(authMiddleware);

// Publicar/gestionar vacantes: propietario.
bolsaRoutes.post('/vacantes', requireRole('propietario'), c.crearVacanteController);
bolsaRoutes.patch('/vacantes/:id', requireRole('propietario'), c.editarVacanteController);
bolsaRoutes.get('/mis-vacantes', requireRole('propietario'), c.misVacantesController);
bolsaRoutes.post('/vacantes/:id/cerrar', requireRole('propietario'), c.cerrarVacanteController);
bolsaRoutes.get('/vacantes/:id/postulaciones', requireRole('propietario'), c.listarPostulacionesDeVacanteController);
bolsaRoutes.post('/postulaciones/:id/aceptar', requireRole('propietario'), c.aceptarPostulacionController);

// Buscar/postular a vacantes: conductor.
bolsaRoutes.get('/vacantes', requireRole('conductor'), c.listarVacantesAbiertasController);
bolsaRoutes.post('/vacantes/:id/postular', requireRole('conductor'), c.postularController);
bolsaRoutes.delete('/postulaciones/:id', requireRole('conductor'), c.retirarPostulacionController);
bolsaRoutes.get('/mis-postulaciones', requireRole('conductor'), c.misPostulacionesController);
