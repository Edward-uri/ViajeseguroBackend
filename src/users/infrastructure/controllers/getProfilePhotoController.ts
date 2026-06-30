import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getProfilePhotoUseCase } from '../dependencies.js';
import { UnauthorizedError } from '../../../core/errors.js';
import { openapiRegistry, ErrorResponseSchema } from '../../../docs/openapiRegistry.js';

openapiRegistry.registerPath({
  method: 'get',
  path: '/api/users/{id}/photo',
  tags: ['Compartido'],
  summary: 'Sirve la foto de perfil de un usuario desde el volumen',
  description: 'Devuelve la imagen (binario). Requiere token. 404 si el usuario no tiene foto.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Imagen', content: { 'image/*': { schema: z.string().openapi({ format: 'binary' }) } } },
    401: {
      description: 'Token ausente, invalido o expirado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    404: { description: 'El usuario no tiene foto de perfil' },
  },
});

export const getProfilePhotoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(404).end();
      return;
    }
    const foto = await getProfilePhotoUseCase(id);
    if (!foto) {
      res.status(404).end();
      return;
    }
    res.setHeader('Content-Type', foto.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(foto.contenido);
  } catch (err) {
    next(err);
  }
};
