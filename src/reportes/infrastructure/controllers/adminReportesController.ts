import type { RequestHandler } from 'express';
import { reportesUseCases } from '../dependencies.js';
import { ListaConductoresReportadosQuerySchema } from '../schemas.js';
import { env } from '../../../core/env.js';

export const listarConductoresReportadosController: RequestHandler = async (req, res, next) => {
  try {
    const q = ListaConductoresReportadosQuerySchema.parse(req.query);
    const result = await reportesUseCases.listarConductoresReportados(q.page, q.perPage);
    res.json({ ...result, umbral: env.REPORTES_UMBRAL_VETO });
  } catch (e) { next(e); }
};

export const detalleConductorReportadoController: RequestHandler = async (req, res, next) => {
  try {
    const idConductor = Number(req.params.id);
    const detalle = await reportesUseCases.detalleConductorReportado(idConductor);
    res.json({ ...detalle, umbral: env.REPORTES_UMBRAL_VETO });
  } catch (e) { next(e); }
};

export const vetarConductorController: RequestHandler = async (req, res, next) => {
  try {
    const idConductor = Number(req.params.id);
    await reportesUseCases.vetarConductor(idConductor);
    res.json({ ok: true });
  } catch (e) { next(e); }
};
