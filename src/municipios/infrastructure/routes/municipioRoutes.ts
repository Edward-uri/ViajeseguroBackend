import { Router } from 'express';
import { listMunicipiosController } from '../controllers/municipioController.js';

export const municipioRoutes: Router = Router();

municipioRoutes.get('/', listMunicipiosController);
