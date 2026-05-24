import type { RequestHandler } from 'express';
import { z } from 'zod';
import { confirmProfilePhotoUploadUseCase } from '../dependencies.js';
import { UnauthorizedError, ValidationError } from '../../../core/errors.js';
import {
  openapiRegistry,
  PublicUserSchema,
  ErrorResponseSchema,
  wrapData,
} from '../../../docs/openapiRegistry.js';

const ConfirmRequestSchema = z
  .object({
    s3Key: z
      .string()
      .min(1)
      .max(512)
      .regex(/^users\/\d+\/profile\/[A-Za-z0-9._-]+$/, 's3Key con formato invalido')
      .openapi({
        description: 'Key devuelta por el endpoint /presign. Debe pertenecer al usuario autenticado.',
        example: 'users/1/profile/abc123.jpg',
      }),
  })
  .openapi('ConfirmProfilePhotoRequest');

openapiRegistry.registerPath({
  method: 'put',
  path: '/api/users/me/photo/confirm',
  tags: ['Users'],
  summary: 'Confirma que la foto fue subida a S3 y la persiste en el perfil',
  description:
    'Recibe la `s3Key` previamente generada por `/presign`. Actualiza la BD con la URL publica y borra la foto anterior de S3 (si existia).',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: ConfirmRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Foto de perfil actualizada',
      content: { 'application/json': { schema: wrapData(PublicUserSchema) } },
    },
    400: {
      description: 'Datos invalidos',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Token ausente, invalido o expirado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    403: {
      description: 'La s3Key no pertenece al usuario autenticado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const confirmProfilePhotoController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const parsed = ConfirmRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Datos invalidos', parsed.error.flatten().fieldErrors);
    }

    const expectedPrefix = `users/${req.user.sub}/profile/`;
    if (!parsed.data.s3Key.startsWith(expectedPrefix)) {
      throw new ValidationError('La s3Key no corresponde al usuario autenticado');
    }

    const user = await confirmProfilePhotoUploadUseCase.execute({
      idUsuario: req.user.sub,
      s3Key: parsed.data.s3Key,
    });
    res.json({ data: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
};
