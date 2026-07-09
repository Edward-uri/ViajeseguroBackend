import { Router } from 'express';
import { authMiddleware, requireRole } from '../../../middleware/authMiddleware.js';
import { subirArchivo } from '../../../infrastructure/storage/multerConfig.js';
import * as c from '../controllers/flotillasController.js';

export const flotillasRoutes: Router = Router();

// Activar propietario es la puerta de entrada al rol (cualquier cuenta autenticada puede
// pedirlo), así que se monta ANTES del gate de abajo: requireRole('conductor','propietario')
// se aplica solo a las rutas registradas después de un app.use() sin path (orden de Express).
flotillasRoutes.post('/propietarios/activar', authMiddleware, c.activarPropietarioController);

// Gestionar flotilla es una capacidad, no una identidad: el conductor dueño de motos
// la usa desde su app, y un propietario dedicado (que no maneja) también. Scoped por ownership.
flotillasRoutes.use(authMiddleware, requireRole('conductor', 'propietario'));

flotillasRoutes.get('/perfil', c.getPerfilController);
flotillasRoutes.put('/perfil', c.putPerfilController);

flotillasRoutes.post('/vehiculos', c.registrarVehiculoController);
flotillasRoutes.get('/vehiculos', c.listarVehiculosController);
flotillasRoutes.patch('/vehiculos/activo', c.setVehiculoActivoController);
flotillasRoutes.get('/vehiculos/:id', c.getVehiculoController);
flotillasRoutes.patch('/vehiculos/:id', c.editarVehiculoController);

flotillasRoutes.post('/vehiculos/:id/conductores', c.asignarConductorController);
flotillasRoutes.get('/vehiculos/:id/conductores', c.listarConductoresAsignadosController);
flotillasRoutes.delete('/vehiculos/:id/conductores/:idConductor', c.revocarConductorController);

const upload = subirArchivo.single('archivo');
flotillasRoutes.post('/vehiculos/:id/documentos/tarjeta-circulacion', upload, c.subirDocumentoVehiculo('tarjeta_circulacion'));
flotillasRoutes.post('/vehiculos/:id/documentos/foto-vehiculo', upload, c.subirDocumentoVehiculo('foto_vehiculo'));
flotillasRoutes.post('/vehiculos/:id/documentos/permiso-municipal', upload, c.subirDocumentoVehiculo('permiso_municipal'));

flotillasRoutes.get('/vehiculos/:id/documentos/:idDoc/archivo', c.getMiArchivoVehiculoController);
