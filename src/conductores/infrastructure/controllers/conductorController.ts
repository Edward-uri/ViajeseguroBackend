import type { RequestHandler } from 'express';
import { conductorUseCases } from '../dependencies.js';
import { LicenciaSchema } from '../schemas.js';
import type { TipoDocumento } from '../../domain/tipos.js';
import { ArchivoRequeridoError } from '../../domain/errors.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const submitLicenciaController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = LicenciaSchema.parse(req.body);
    const c = await conductorUseCases.submitLicencia({ idConductor: req.user.sub, ...dto });
    res.json({
      idConductor: c.idConductor,
      idMunicipio: c.idMunicipio,
      licencia: c.licencia,
      licenciaFechaExpedicion: c.licenciaFechaExpedicion,
      licenciaFechaVencimiento: c.licenciaFechaVencimiento,
    });
  } catch (e) { next(e); }
};

/** Devuelve un handler de subida fijado a un tipo de documento concreto. */
export function subirDocumento(tipo: TipoDocumento): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const file = req.file;
      if (!file) throw new ArchivoRequeridoError();
      const doc = await conductorUseCases.uploadDocumento({
        idConductor: req.user.sub,
        tipo,
        contenido: file.buffer,
        mimeType: file.mimetype,
        nombreOriginal: file.originalname ?? null,
      });
      res.status(201).json(doc.toJSON());
    } catch (e) { next(e); }
  };
}

export const getOnboardingController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json(await conductorUseCases.getOnboarding({ idConductor: req.user.sub }));
  } catch (e) { next(e); }
};

export const getMiArchivoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idDocumento = Number(req.params.id);
    const { contenido, mimeType } = await conductorUseCases.getArchivo({
      idDocumento,
      solicitante: { idUsuario: req.user.sub, esAdmin: false },
    });
    res.setHeader('Content-Type', mimeType);
    res.send(contenido);
  } catch (e) { next(e); }
};
