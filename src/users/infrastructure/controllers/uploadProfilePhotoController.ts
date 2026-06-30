import type { RequestHandler } from 'express';
import { z } from 'zod';
import { uploadProfilePhotoUseCase } from '../dependencies.js';
import { UnauthorizedError, ValidationError } from '../../../core/errors.js';
import { toServingUserJSON } from '../userView.js';
import {
  openapiRegistry,
  PublicUserSchema,
  ErrorResponseSchema,
  wrapData,
} from '../../../docs/openapiRegistry.js';

openapiRegistry.registerPath({
  method: 'put',
  path: '/api/users/me/photo',
  tags: ['Compartido'],
  summary: 'Sube o reemplaza la foto de perfil (multipart, campo "foto")',
  description:
    'Subida directa multipart al backend; el archivo se guarda en el volumen montado. ' +
    'Devuelve el usuario con `fotoPerfilUrl` apuntando a `GET /api/users/{id}/photo`.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: z.object({ foto: z.string().openapi({ format: 'binary' }) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Foto de perfil actualizada',
      content: { 'application/json': { schema: wrapData(PublicUserSchema) } },
    },
    400: {
      description: 'Imagen inválida (solo jpeg, png o webp)',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Token ausente, invalido o expirado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const uploadProfilePhotoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    if (!req.file) throw new ValidationError('Falta el archivo de imagen (campo "foto")');
    const user = await uploadProfilePhotoUseCase({
      idUsuario: req.user.sub,
      contenido: req.file.buffer,
      mimeType: req.file.mimetype,
    });
    res.json({ data: toServingUserJSON(user) });
  } catch (err) {
    next(err);
  }
};
