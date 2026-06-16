import type { RequestHandler } from 'express';
import { municipioUseCases } from '../dependencies.js';

export const listMunicipiosController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ data: await municipioUseCases.listMunicipios() });
  } catch (e) { next(e); }
};
