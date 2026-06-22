import type { RequestHandler } from 'express';
import { editarPerfilUseCase } from '../dependencies.js';
import { UnauthorizedError, ValidationError } from '../../../core/errors.js';
import {
  openapiRegistry,
  PublicUserSchema,
  ErrorResponseSchema,
  wrapData,
} from '../../../docs/openapiRegistry.js';
import { toServingUserJSON } from '../userView.js';
import { EditarPerfilSchema } from '../schemas.js';

openapiRegistry.registerPath({
  method: 'put',
  path: '/api/users/me',
  tags: ['Compartido'],
  summary: 'Edita el perfil del usuario autenticado',
  description:
    'Actualiza parcialmente los campos de perfil del usuario (nombre, apellidos, sexo, fecha de nacimiento, teléfono). El correo electrónico no es editable.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: EditarPerfilSchema } },
    },
  },
  responses: {
    200: {
      description: 'Perfil actualizado',
      content: { 'application/json': { schema: wrapData(PublicUserSchema) } },
    },
    400: {
      description: 'Datos invalidos o body vacío',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Token ausente, invalido o expirado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'El teléfono ya está en uso por otro usuario',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const editarPerfilController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const parsed = EditarPerfilSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Datos invalidos', parsed.error.flatten().fieldErrors);
    }
    const user = await editarPerfilUseCase.execute(req.user.sub, parsed.data);
    res.json({ data: await toServingUserJSON(user) });
  } catch (err) {
    next(err);
  }
};
