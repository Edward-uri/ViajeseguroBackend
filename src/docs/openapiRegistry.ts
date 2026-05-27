import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);


export const openapiRegistry = new OpenAPIRegistry();

export const RolSchema = z
  .enum(['pasajero', 'conductor', 'propietario', 'admin'])
  .openapi('Rol');

export const EstadoCuentaSchema = z
  .enum(['activo', 'suspendido', 'eliminado'])
  .openapi('EstadoCuenta');

export const PublicUserSchema = z
  .object({
    idUsuario: z.number().int().openapi({ example: 1 }),
    nombreUsuario: z.string().openapi({ example: 'edu' }),
    rol: RolSchema,
    estadoCuenta: EstadoCuentaSchema,
    fechaRegistro: z.string().datetime().nullable(),
    fotoPerfilUrl: z.string().url().nullable(),
  })
  .openapi('PublicUser');

export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
      message: z.string().openapi({ example: 'Datos invalidos' }),
      details: z.unknown().optional(),
    }),
  })
  .openapi('ErrorResponse');

/**
 * Shape unico que devuelven los endpoints que emiten sesion:
 * `POST /api/auth/login` y `POST /api/auth/register`.
 *
 * Tener un solo schema garantiza que ambos endpoints respondan
 * exactamente lo mismo, y que el cliente pueda usar el mismo parser
 * para los dos.
 */
export const AuthSuccessResponseSchema = z
  .object({
    data: z.object({
      user: PublicUserSchema,
      token: z.string().openapi({
        description: 'JWT firmado, valido por JWT_EXPIRES_IN',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }),
    }),
  })
  .openapi('AuthSuccessResponse');

export function wrapData<T extends z.ZodTypeAny>(schema: T) {
  return z.object({ data: schema });
}
