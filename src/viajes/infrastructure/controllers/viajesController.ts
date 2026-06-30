import type { RequestHandler } from 'express';
import { viajeUseCases } from '../dependencies.js';
import * as S from '../schemas.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const getTarifarioController: RequestHandler = async (req, res, next) => {
  try {
    res.json({ data: await viajeUseCases.getTarifario(Number(req.params.id)) });
  } catch (e) { next(e); }
};

export const crearViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = S.CrearViajeSchema.parse(req.body);
    const viaje = await viajeUseCases.crearViaje({ idPasajero: req.user.sub, ...dto });
    res.status(201).json(viaje);
  } catch (e) { next(e); }
};

export const estimarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = S.CrearViajeSchema.parse(req.body);
    res.json(await viajeUseCases.estimarViaje(dto));
  } catch (e) { next(e); }
};

export const getViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json(await viajeUseCases.getViaje(S.IdParamSchema.parse(req.params.id), req.user.sub));
  } catch (e) { next(e); }
};

export const listarMisViajesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await viajeUseCases.listarMisViajes(req.user.sub) });
  } catch (e) { next(e); }
};

export const getViajeActivoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await viajeUseCases.getViajeActivo(req.user.sub) });
  } catch (e) { next(e); }
};

export const cancelarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = S.CancelarViajeSchema.parse(req.body);
    res.json(await viajeUseCases.cancelarViaje(S.IdParamSchema.parse(req.params.id), req.user.sub, dto.motivo ?? null));
  } catch (e) { next(e); }
};

export const aceptarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = S.AceptarViajeSchema.parse(req.body);
    res.json(await viajeUseCases.aceptarViaje(S.IdParamSchema.parse(req.params.id), req.user.sub, dto.idVehiculo));
  } catch (e) { next(e); }
};

export const soltarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json(await viajeUseCases.conductorCancelaViaje(S.IdParamSchema.parse(req.params.id), req.user.sub));
  } catch (e) { next(e); }
};

export const iniciarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json(await viajeUseCases.iniciarViaje(S.IdParamSchema.parse(req.params.id), req.user.sub));
  } catch (e) { next(e); }
};

export const completarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json(await viajeUseCases.completarViaje(S.IdParamSchema.parse(req.params.id), req.user.sub));
  } catch (e) { next(e); }
};

export const evaluarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = S.EvaluacionSchema.parse(req.body);
    res.json(await viajeUseCases.evaluarViaje(S.IdParamSchema.parse(req.params.id), req.user.sub, dto));
  } catch (e) { next(e); }
};

export const registrarDispositivoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = S.DispositivoSchema.parse(req.body);
    res.json(await viajeUseCases.registrarDispositivo(req.user.sub, dto));
  } catch (e) { next(e); }
};

export const listarPendientesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await viajeUseCases.listarViajesPendientes(req.user.sub) });
  } catch (e) { next(e); }
};

export const listarAsignadosController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await viajeUseCases.listarViajesAsignados(req.user.sub) });
  } catch (e) { next(e); }
};

export const rechazarViajeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    await viajeUseCases.rechazarViaje(S.IdParamSchema.parse(req.params.id), req.user.sub);
    res.status(204).end();
  } catch (e) { next(e); }
};
