import type { RequestHandler } from 'express';
import { z } from 'zod';
import { presignProfilePhotoUploadUseCase } from '../dependencies.js';
import { UnauthorizedError, ValidationError } from '../../../core/errors.js';
import { ALLOWED_IMAGE_CONTENT_TYPES } from '../../../infrastructure/s3.js';
import {
  openapiRegistry,
  ErrorResponseSchema,
  wrapData,
} from '../../../docs/openapiRegistry.js';

const PresignRequestSchema = z
  .object({
    contentType: z
      .enum(['image/jpeg', 'image/png', 'image/webp'])
      .openapi({
        description: 'Content-Type del archivo a subir. Solo se aceptan estos tres.',
        example: 'image/jpeg',
      }),
  })
  .openapi('PresignProfilePhotoRequest');

const PresignDataSchema = z
  .object({
    uploadUrl: z.string().url().openapi({
      description: 'URL pre-firmada de S3. El cliente debe hacer PUT con el archivo y el mismo contentType.',
    }),
    s3Key: z.string().openapi({
      description: 'Identificador del objeto en S3. Reenviarlo al endpoint de confirmacion.',
      example: 'users/1/profile/abc123.jpg',
    }),
    publicUrl: z.string().url().openapi({
      description: 'URL publica que quedara persistida tras confirmar la subida.',
    }),
    expiresIn: z.number().int().openapi({ example: 300, description: 'Segundos de validez del uploadUrl.' }),
    maxBytes: z.number().int().openapi({ example: 5242880, description: 'Tamaño maximo aceptado.' }),
  })
  .openapi('PresignProfilePhotoData');

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/users/me/photo/presign',
  tags: ['Users'],
  summary: 'Solicita una URL pre-firmada para subir la foto de perfil a S3',
  description:
    'Devuelve `uploadUrl` (PUT directo a S3) y `s3Key`. Tras subir, llamar a `PUT /api/users/me/photo/confirm` con esa key.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: PresignRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'URL pre-firmada generada',
      content: { 'application/json': { schema: wrapData(PresignDataSchema) } },
    },
    400: {
      description: 'Content-Type no permitido',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Token ausente, invalido o expirado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const presignProfilePhotoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const parsed = PresignRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Datos invalidos', {
        ...parsed.error.flatten().fieldErrors,
        contentType_allowed: ALLOWED_IMAGE_CONTENT_TYPES,
      });
    }
    const data = await presignProfilePhotoUploadUseCase.execute({
      idUsuario: req.user.sub,
      contentType: parsed.data.contentType,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
};
