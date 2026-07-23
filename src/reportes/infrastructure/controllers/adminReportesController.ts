import type { RequestHandler } from 'express';
import { reportesUseCases } from '../dependencies.js';
import { ListaReportadosQuerySchema, DetalleReporteQuerySchema } from '../schemas.js';
import { env } from '../../../core/env.js';

export const listarUsuariosReportadosController: RequestHandler = async (req, res, next) => {
  try {
    const q = ListaReportadosQuerySchema.parse(req.query);
    const result = await reportesUseCases.listarUsuariosReportados(q.page, q.perPage);
    res.json({ ...result, umbral: env.REPORTES_UMBRAL_VETO });
  } catch (e) { next(e); }
};

export const detalleUsuarioReportadoController: RequestHandler = async (req, res, next) => {
  try {
    const idUsuario = Number(req.params.id);
    const { rol } = DetalleReporteQuerySchema.parse(req.query);
    const detalle = await reportesUseCases.detalleUsuarioReportado(idUsuario, rol);
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

export const reactivarConductorController: RequestHandler = async (req, res, next) => {
  try {
    const idConductor = Number(req.params.id);
    await reportesUseCases.reactivarConductor(idConductor);
    res.json({ ok: true });
  } catch (e) { next(e); }
};
