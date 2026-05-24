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

export function wrapData<T extends z.ZodTypeAny>(schema: T) {
  return z.object({ data: schema });
}
