import type { RequestHandler } from 'express';
import { getMeUseCase } from '../dependencies.js';
import { UnauthorizedError } from '../../../core/errors.js';
import {
  openapiRegistry,
  MeResponseSchema,
  ErrorResponseSchema,
  wrapData,
} from '../../../docs/openapiRegistry.js';
import { toServingUserJSON } from '../userView.js';

openapiRegistry.registerPath({
  method: 'get',
  path: '/api/users/me',
  tags: ['Compartido'],
  summary: 'Perfil del usuario autenticado',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Perfil del usuario',
      content: { 'application/json': { schema: wrapData(MeResponseSchema) } },
    },
    401: {
      description: 'Token ausente, invalido o expirado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: {
      description: 'Usuario no encontrado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const getMeController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const { user, persona, roles } = await getMeUseCase.execute(req.user.sub);
    // Bloque "datos del usuario": datos personales + correo/teléfono juntos.
    const datos = {
      nombre: persona?.nombre ?? null,
      apellidoPaterno: persona?.apellidoPaterno ?? null,
      apellidoMaterno: persona?.apellidoMaterno ?? null,
      fechaNacimiento: persona?.fechaNacimiento ?? null,
      correo: user.correoElectronico,
      telefono: user.telefono,
    };
    // fase 1: 'rol' aquí es la columna legacy de usuarios; el 'rol' del token es el principal derivado de roles[].
    // Al hacer DROP COLUMN (fase 2), servir rolPrincipal(roles).
    res.json({ data: { ...toServingUserJSON(user), roles, persona: datos } });
  } catch (err) {
    next(err);
  }
};
