import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import { subirArchivo } from '../../../infrastructure/storage/multerConfig.js';
import * as c from '../controllers/conductorController.js';

export const conductorRoutes: Router = Router();

conductorRoutes.use(authMiddleware, requireRole('conductor'));
conductorRoutes.post('/onboarding/licencia', c.submitLicenciaController);
conductorRoutes.post('/disponibilidad', c.setDisponibilidadController);
conductorRoutes.get('/disponibilidad', c.getDisponibilidadController);

const upload = subirArchivo.single('archivo');
conductorRoutes.post('/documentos/licencia', upload, c.subirDocumento('licencia'));
conductorRoutes.post('/documentos/ine-frente', upload, c.subirDocumento('ine_frente'));
conductorRoutes.post('/documentos/ine-reverso', upload, c.subirDocumento('ine_reverso'));
// Los documentos del vehículo (tarjeta de circulación, foto) se suben en flotillas,
// ligados a un vehiculo real: POST /api/flotillas/vehiculos/:id/documentos/*

conductorRoutes.get('/onboarding', c.getOnboardingController);
conductorRoutes.get('/documentos/:id/archivo', c.getMiArchivoController);
conductorRoutes.get('/stats', c.getStatsController);
conductorRoutes.get('/ganancias', c.getGananciasController);
