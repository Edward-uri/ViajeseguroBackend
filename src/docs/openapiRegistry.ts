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
    telefono: z.string().openapi({ example: '9611234567' }),
    correoElectronico: z.string().email().nullable().openapi({ example: 'juan@correo.com' }),
    /** Derivado de `roles[]` (mayor prioridad: admin > propietario > conductor > pasajero). No es una columna propia. */
    rol: RolSchema,
    estadoCuenta: EstadoCuentaSchema,
    telefonoVerificado: z.boolean(),
    tienePassword: z.boolean(),
    idMunicipio: z.number().int().nullable().openapi({ example: 1 }),
    fotoPerfilUrl: z.string().url().nullable(),
    fechaRegistro: z.string().datetime().nullable(),
    esPropietario: z.boolean().openapi({ example: false }),
  })
  .openapi('PublicUser');

/** Datos personales (descifrados) que devuelve GET /api/users/me en el bloque `persona`. */
export const PersonaPerfilSchema = z
  .object({
    nombre: z.string().nullable().openapi({ example: 'Juan' }),
    apellidoPaterno: z.string().nullable().openapi({ example: 'Pérez' }),
    apellidoMaterno: z.string().nullable().openapi({ example: 'López' }),
    fechaNacimiento: z.string().nullable().openapi({ example: '1990-05-14' }),
    correo: z.string().email().nullable().openapi({ example: 'juan@correo.com' }),
    telefono: z.string().nullable().openapi({ example: '9611234567' }),
  })
  .openapi('PersonaPerfil');

/** Respuesta de GET /api/users/me: el usuario público + `roles` (todos los roles del usuario) + el bloque `persona`. */
export const MeResponseSchema = PublicUserSchema.extend({
  roles: z.array(RolSchema),
  persona: PersonaPerfilSchema,
}).openapi('MeResponse');

export const ErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: 'VALIDATION_ERROR' }),
      message: z.string().openapi({ example: 'Datos invalidos' }),
      details: z.unknown().optional(),
    }),
  })
  .openapi('ErrorResponse');

/** Respuesta de los endpoints que emiten sesión (register/complete, login/verify, login/password, invitaciones/aceptar). */
export const SessionResponseSchema = z
  .object({
    accessToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    refreshToken: z.string().openapi({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    user: PublicUserSchema,
    roles: z.array(RolSchema),
  })
  .openapi('SessionResponse');

export function wrapData<T extends z.ZodTypeAny>(schema: T) {
  return z.object({ data: schema });
}
