import type { RequestHandler } from 'express';
import { z } from 'zod';
import { registerUserUseCase } from '../dependencies.js';
import { ValidationError } from '../../../core/errors.js';
import {
  openapiRegistry,
  AuthSuccessResponseSchema,
  ErrorResponseSchema,
} from '../../../docs/openapiRegistry.js';
import { toServingUserJSON } from '../userView.js';

const RegisterRequestSchema = z
  .object({
    nombreUsuario: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, numeros y guion bajo')
      .openapi({ example: 'edu' }),
    password: z
      .string()
      .min(8)
      .max(128)
      .openapi({ example: 'supersegura12', format: 'password' }),
    rol: z.enum(['pasajero', 'conductor', 'propietario']).openapi({ example: 'pasajero' }),
    nombre: z.string().min(1).max(30).openapi({ example: 'Eduardo' }),
    apellidoPaterno: z.string().min(1).max(30).openapi({ example: 'Chavez' }),
    apellidoMaterno: z.string().max(30).optional().openapi({ example: 'Diaz' }),
    idSexo: z.coerce.number().int().positive().optional().openapi({ example: 1 }),
    correoElectronico: z.string().email().max(60).openapi({ example: 'edu@example.com' }),
    telefono: z.string().max(15).optional().openapi({ example: '9611234567' }),
    fechaNacimiento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD')
      .optional()
      .openapi({ example: '2002-08-15', format: 'date' }),
  })
  .openapi('RegisterRequest');


openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Registrar usuario + persona',
  description:
    'Crea un usuario con sus datos personales en una sola transaccion, ' +
    'hashea la password con bcrypt y devuelve un JWT para que el usuario ' +
    'quede logueado de una vez (mismo shape que /api/auth/login).',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: RegisterRequestSchema } },
    },
  },
  responses: {
    201: {
      description: 'Usuario creado y autenticado',
      content: { 'application/json': { schema: AuthSuccessResponseSchema } },
    },
    400: {
      description: 'Datos invalidos',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Usuario o correo ya registrado',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});


export const registerUserController: RequestHandler = async (req, res, next) => {
  try {
    const parsed = RegisterRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Datos invalidos', parsed.error.flatten().fieldErrors);
    }
    const { user, token } = await registerUserUseCase.execute(parsed.data);
    res.status(201).json({ data: { user: await toServingUserJSON(user), token } });
  } catch (err) {
    next(err);
  }
};
