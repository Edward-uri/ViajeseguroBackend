import type { RequestHandler } from 'express';
import { deleteAccountUseCase } from '../dependencies.js';
import { UnauthorizedError } from '../../../core/errors.js';
import {
  openapiRegistry,
  ErrorResponseSchema,
} from '../../../docs/openapiRegistry.js';

openapiRegistry.registerPath({
  method: 'delete',
  path: '/api/users/me',
  tags: ['Compartido'],
  summary: 'Eliminar cuenta (soft-delete) del usuario autenticado',
  description:
    'Marca la cuenta como `eliminado`, borra la foto de perfil de S3 (si existia) y limpia los campos de foto. La operacion es irreversible desde la API.',
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: 'Cuenta eliminada' },
    401: {
      description: 'Token ausente, invalido o expirado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const deleteAccountController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    await deleteAccountUseCase.execute(req.user.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
