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
conductorRoutes.post('/documentos/tarjeta-circulacion', upload, c.subirDocumento('tarjeta_circulacion'));
conductorRoutes.post('/documentos/foto-vehiculo', upload, c.subirDocumento('foto_vehiculo'));

conductorRoutes.get('/onboarding', c.getOnboardingController);
conductorRoutes.get('/documentos/:id/archivo', c.getMiArchivoController);
