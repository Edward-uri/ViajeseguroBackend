import type { RequestHandler } from 'express';
import { conductorUseCases } from '../dependencies.js';
import { RevisarDocumentoSchema } from '../schemas.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const listPendientesController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ data: await conductorUseCases.listConductoresPendientes() });
  } catch (e) { next(e); }
};

export const getConductorDetalleController: RequestHandler = async (req, res, next) => {
  try {
    const idConductor = Number(req.params.id);
    res.json(await conductorUseCases.getOnboarding({ idConductor }));
  } catch (e) { next(e); }
};

export const reviewDocumentoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idDocumento = Number(req.params.id);
    const dto = RevisarDocumentoSchema.parse(req.body);
    const motivoRechazo = dto.estado === 'rechazado' ? dto.motivoRechazo : null;
    res.json(
      await conductorUseCases.reviewDocumento({
        idDocumento,
        estado: dto.estado,
        motivoRechazo,
        adminId: req.user.sub,
      }),
    );
  } catch (e) { next(e); }
};

export const getArchivoAdminController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idDocumento = Number(req.params.id);
    const { contenido, mimeType } = await conductorUseCases.getArchivo({
      idDocumento,
      solicitante: { idUsuario: req.user.sub, esAdmin: true },
    });
    res.setHeader('Content-Type', mimeType);
    res.send(contenido);
  } catch (e) { next(e); }
};
