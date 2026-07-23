import type { RequestHandler } from 'express';
import { reportesUseCases } from '../dependencies.js';
import { ReportarSchema } from '../schemas.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const reportarController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = ReportarSchema.parse(req.body);
    const reporte = await reportesUseCases.crearReporte({
      idViaje: dto.idViaje,
      idReportante: req.user.sub,
      motivo: dto.motivo,
      comentario: dto.comentario ?? null,
    });
    res.status(201).json(reporte);
  } catch (e) {
    next(e);
  }
};
