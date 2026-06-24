import type { RequestHandler } from 'express';
import { authUseCases } from '../dependencies.js';
import * as S from '../schemas.js';
import { pool } from '../../../core/db.js';
import { UnauthorizedError } from '../../../core/errors.js';

export const crearInvitacionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { correo } = S.CrearInvitacionSchema.parse(req.body);
    const { rows } = await pool.query<{ correo_electronico: string }>(
      'SELECT correo_electronico FROM usuarios WHERE id_usuario = $1', [req.user.sub],
    );
    const invitadorCorreo = rows[0]?.correo_electronico ?? '';
    const out = await authUseCases.crearInvitacion({
      correo, invitadoPor: req.user.sub, invitadorCorreo,
    });
    res.status(201).json(out);
  } catch (e) { next(e); }
};

export const listarInvitacionesController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ data: await authUseCases.listarInvitaciones() });
  } catch (e) { next(e); }
};

export const revocarInvitacionController: RequestHandler = async (req, res, next) => {
  try {
    await authUseCases.revocarInvitacion(Number(req.params.id));
    res.status(204).end();
  } catch (e) { next(e); }
};

export const aceptarInvitacionController: RequestHandler = async (req, res, next) => {
  try {
    const dto = S.AceptarInvitacionSchema.parse(req.body);
    res.json(await authUseCases.aceptarInvitacion(dto));
  } catch (e) { next(e); }
};
