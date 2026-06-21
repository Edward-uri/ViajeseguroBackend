import type { RequestHandler } from 'express';
import { viajeUseCases } from '../dependencies.js';
import * as S from '../schemas.js';

export const listarZonasAdminController: RequestHandler = async (req, res, next) => {
  try {
    const idMunicipio = S.IdParamSchema.parse(req.params.idMunicipio);
    res.json({ data: await viajeUseCases.listarZonasAdmin(idMunicipio) });
  } catch (e) { next(e); }
};

export const crearZonaController: RequestHandler = async (req, res, next) => {
  try {
    const idMunicipio = S.IdParamSchema.parse(req.params.idMunicipio);
    const dto = S.CrearZonaSchema.parse(req.body);
    const zona = await viajeUseCases.crearZona({
      idMunicipio,
      nombre: dto.nombre,
      precio: dto.precio,
      latCentro: dto.lat ?? null,
      lngCentro: dto.lng ?? null,
    });
    res.status(201).json({ data: zona });
  } catch (e) { next(e); }
};

export const actualizarZonaController: RequestHandler = async (req, res, next) => {
  try {
    const idMunicipio = S.IdParamSchema.parse(req.params.idMunicipio);
    const idZona = S.IdParamSchema.parse(req.params.idZona);
    const dto = S.ActualizarZonaSchema.parse(req.body);
    const zona = await viajeUseCases.actualizarZona({
      idZona,
      idMunicipio,
      nombre: dto.nombre,
      precio: dto.precio,
      latCentro: dto.lat,
      lngCentro: dto.lng,
      activo: dto.activo,
    });
    res.json({ data: zona });
  } catch (e) { next(e); }
};

export const desactivarZonaController: RequestHandler = async (req, res, next) => {
  try {
    const idMunicipio = S.IdParamSchema.parse(req.params.idMunicipio);
    const idZona = S.IdParamSchema.parse(req.params.idZona);
    await viajeUseCases.desactivarZona({ idZona, idMunicipio });
    res.status(204).end();
  } catch (e) { next(e); }
};
