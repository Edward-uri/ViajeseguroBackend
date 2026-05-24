import type { RequestHandler } from 'express';
import { z } from 'zod';
import { loginUserUseCase } from '../dependencies.js';
import { ValidationError } from '../../../core/errors.js';
import {
  openapiRegistry,
  PublicUserSchema,
  ErrorResponseSchema,
} from '../../../docs/openapiRegistry.js';

const LoginRequestSchema = z
  .object({
    identifier: z
      .string()
      .min(1, 'Indica nombre de usuario o correo electronico')
      .max(60)
      .openapi({
        description: 'Nombre de usuario o correo electronico',
        example: 'edu',
      }),
    password: z.string().min(1).max(128).openapi({ example: 'supersegura12', format: 'password' }),
  })
  .openapi('LoginRequest');

const LoginResponseSchema = z
  .object({
    data: z.object({
      user: PublicUserSchema,
      token: z.string().openapi({
        description: 'JWT firmado, valido por JWT_EXPIRES_IN',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }),
    }),
  })
  .openapi('LoginResponse');

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Login con (nombre de usuario o correo) + password',
  description:
    'Acepta el mismo campo `identifier` para nombre de usuario o correo electronico. El servidor decide cual coincide.',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: LoginRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Login correcto',
      content: { 'application/json': { schema: LoginResponseSchema } },
    },
    400: {
      description: 'Datos invalidos',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    401: {
      description: 'Credenciales invalidas o cuenta no activa',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export const loginUserController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = LoginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Datos invalidos', parsed.error.flatten().fieldErrors);
    }
    const { user, token } = await loginUserUseCase.execute(parsed.data);
    res.json({ data: { user: user.toPublicJSON(), token } });
  } catch (err) {
    next(err);
  }
};
