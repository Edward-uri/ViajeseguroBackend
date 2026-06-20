import type { RequestHandler } from 'express';
import { flotillaUseCases } from '../dependencies.js';
import { PerfilSchema, VehiculoSchema, EditarVehiculoSchema } from '../schemas.js';
import type { TipoDocumentoVehiculo } from '../../domain/tipos.js';
import { ArchivoRequeridoError } from '../../domain/errors.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const getPerfilController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json(await flotillaUseCases.getPerfil({ idPropietario: req.user.sub }));
  } catch (e) { next(e); }
};

export const putPerfilController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = PerfilSchema.parse(req.body);
    res.json(await flotillaUseCases.upsertPerfil({
      idPropietario: req.user.sub,
      rfc: dto.rfc ?? null,
      razonSocial: dto.razonSocial ?? null,
    }));
  } catch (e) { next(e); }
};

export const registrarVehiculoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = VehiculoSchema.parse(req.body);
    const v = await flotillaUseCases.registrarVehiculo({
      idPropietario: req.user.sub,
      placa: dto.placa,
      modelo: dto.modelo ?? null,
      color: dto.color ?? null,
      anio: dto.anio ?? null,
      idMunicipio: dto.idMunicipio,
    });
    res.status(201).json(v);
  } catch (e) { next(e); }
};

export const listarVehiculosController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await flotillaUseCases.listarVehiculos({ idPropietario: req.user.sub }) });
  } catch (e) { next(e); }
};

export const getVehiculoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idVehiculo = Number(req.params.id);
    res.json(await flotillaUseCases.getVehiculo({
      idVehiculo,
      solicitante: { idUsuario: req.user.sub, esAdmin: false },
    }));
  } catch (e) { next(e); }
};

export const editarVehiculoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idVehiculo = Number(req.params.id);
    const dto = EditarVehiculoSchema.parse(req.body);
    res.json(await flotillaUseCases.editarVehiculo({ idVehiculo, idPropietario: req.user.sub, ...dto }));
  } catch (e) { next(e); }
};

/** Devuelve un handler de subida fijado a un tipo de documento concreto. */
export function subirDocumentoVehiculo(tipo: TipoDocumentoVehiculo): RequestHandler {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const idVehiculo = Number(req.params.id);
      const file = req.file;
      if (!file) throw new ArchivoRequeridoError();
      const doc = await flotillaUseCases.uploadDocumentoVehiculo({
        idVehiculo,
        idPropietario: req.user.sub,
        tipo,
        contenido: file.buffer,
        mimeType: file.mimetype,
        nombreOriginal: file.originalname ?? null,
      });
      res.status(201).json(doc.toJSON());
    } catch (e) { next(e); }
  };
}

export const getMiArchivoVehiculoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idDocumento = Number(req.params.idDoc);
    const { contenido, mimeType } = await flotillaUseCases.getArchivoVehiculo({
      idDocumento,
      solicitante: { idUsuario: req.user.sub, esAdmin: false },
    });
    res.setHeader('Content-Type', mimeType);
    res.send(contenido);
  } catch (e) { next(e); }
};
