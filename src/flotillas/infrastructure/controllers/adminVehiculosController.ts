import type { RequestHandler } from 'express';
import { flotillaUseCases } from '../dependencies.js';
import { RevisarDocumentoVehiculoSchema } from '../schemas.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const listPendientesController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ data: await flotillaUseCases.listVehiculosPendientes() });
  } catch (e) { next(e); }
};

export const getVehiculoDetalleController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idVehiculo = Number(req.params.id);
    res.json(await flotillaUseCases.getVehiculo({
      idVehiculo,
      solicitante: { idUsuario: req.user.sub, esAdmin: true },
    }));
  } catch (e) { next(e); }
};

export const reviewDocumentoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idDocumento = Number(req.params.id);
    const dto = RevisarDocumentoVehiculoSchema.parse(req.body);
    const motivoRechazo = dto.estado === 'rechazado' ? dto.motivoRechazo : null;
    res.json(
      await flotillaUseCases.reviewDocumentoVehiculo({
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
    const { contenido, mimeType } = await flotillaUseCases.getArchivoVehiculo({
      idDocumento,
      solicitante: { idUsuario: req.user.sub, esAdmin: true },
    });
    res.setHeader('Content-Type', mimeType);
    res.send(contenido);
  } catch (e) { next(e); }
};
