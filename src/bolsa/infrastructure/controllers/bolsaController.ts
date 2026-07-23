import type { RequestHandler } from 'express';
import { bolsaUseCases } from '../dependencies.js';
import { CrearVacanteSchema, EditarVacanteSchema, PostularSchema, ListarVacantesQuerySchema } from '../schemas.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const crearVacanteController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = CrearVacanteSchema.parse(req.body);
    const vacante = await bolsaUseCases.crearVacante({
      idPropietario: req.user.sub,
      idVehiculo: dto.idVehiculo,
      tipoTurno: dto.tipoTurno,
      rentaTurno: dto.rentaTurno,
      dias: dto.dias,
      horario: dto.horario ?? null,
      condiciones: dto.condiciones ?? null,
    });
    res.status(201).json(vacante);
  } catch (e) { next(e); }
};

export const editarVacanteController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idVacante = Number(req.params.id);
    const dto = EditarVacanteSchema.parse(req.body);
    const vacante = await bolsaUseCases.editarVacante({
      idVacante,
      idPropietario: req.user.sub,
      tipoTurno: dto.tipoTurno,
      rentaTurno: dto.rentaTurno,
      dias: dto.dias,
      horario: dto.horario ?? null,
      condiciones: dto.condiciones ?? null,
    });
    res.json(vacante);
  } catch (e) { next(e); }
};

export const listarVacantesAbiertasController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const q = ListarVacantesQuerySchema.parse(req.query);
    res.json({ data: await bolsaUseCases.listarVacantesAbiertas(q.municipio, req.user.sub) });
  } catch (e) { next(e); }
};

export const misVacantesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await bolsaUseCases.misVacantes(req.user.sub) });
  } catch (e) { next(e); }
};

export const cerrarVacanteController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idVacante = Number(req.params.id);
    res.json(await bolsaUseCases.cerrarVacante({ idVacante, idPropietario: req.user.sub }));
  } catch (e) { next(e); }
};

export const postularController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idVacante = Number(req.params.id);
    const dto = PostularSchema.parse(req.body);
    const postulacion = await bolsaUseCases.postular({
      idVacante,
      idConductor: req.user.sub,
      mensaje: dto.mensaje ?? null,
    });
    res.status(201).json(postulacion);
  } catch (e) { next(e); }
};

export const retirarPostulacionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idPostulacion = Number(req.params.id);
    res.json(await bolsaUseCases.retirarPostulacion({ idPostulacion, idConductor: req.user.sub }));
  } catch (e) { next(e); }
};

export const listarPostulacionesDeVacanteController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idVacante = Number(req.params.id);
    res.json({ data: await bolsaUseCases.listarPostulacionesDeVacante({ idVacante, idPropietario: req.user.sub }) });
  } catch (e) { next(e); }
};

export const aceptarPostulacionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const idPostulacion = Number(req.params.id);
    const { postulacion, vacante } = await bolsaUseCases.aceptarPostulacion({ idPostulacion, idPropietario: req.user.sub });
    res.json({ postulacion, vacante });
  } catch (e) { next(e); }
};

export const misPostulacionesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await bolsaUseCases.misPostulaciones(req.user.sub) });
  } catch (e) { next(e); }
};
