import { Router, type RequestHandler } from 'express';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';
import { env } from '../core/env.js';
import { conductorUseCases } from '../conductores/infrastructure/dependencies.js';
import { UnauthorizedError } from '../core/errors.js';

export const zonasRoutes: Router = Router();

// Proxy del modelo de zonas calientes: la app (incluida la web) llama a SU backend
// y este consulta al modelo servidor-a-servidor, evitando el bloqueo de CORS.
const getZonasController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const municipio = await conductorUseCases.municipioOperativo(req.user.sub);
    if (municipio == null) {
      res.json({ municipio: null, zonas: [] });
      return;
    }
    const diaSemana = Number(req.query.dia_semana);
    const hora = Number(req.query.hora);
    // Más zonas para que el mapa del conductor se vea lleno (schema del modelo permite hasta 20).
    const top = Number(req.query.top) || 20;

    const resp = await fetch(`${env.ZONAS_URL}/inferencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        municipio,
        dia_semana: Number.isFinite(diaSemana) ? diaSemana : 0,
        hora: Number.isFinite(hora) ? hora : 0,
        top,
      }),
    });

    if (!resp.ok) {
      res.json({ municipio, zonas: [] });
      return;
    }
    res.json(await resp.json());
  } catch (e) {
    next(e);
  }
};

zonasRoutes.get('/calientes', authMiddleware, requireRole('conductor'), getZonasController);
