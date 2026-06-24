import { z } from 'zod';
import {
  openapiRegistry,
  SessionResponseSchema,
  ErrorResponseSchema,
} from '../../docs/openapiRegistry.js';
import {
  RegisterStartSchema,
  RegisterVerifySchema,
  RegisterCompleteSchema,
  LoginStartSchema,
  LoginVerifySchema,
  RefreshSchema,
  LogoutSchema,
  SetPasswordSchema,
  LoginPasswordSchema,
  CrearInvitacionSchema,
  AceptarInvitacionSchema,
} from './schemas.js';

const MensajeSchema = z.object({ message: z.string() }).openapi('Mensaje');
const OkSchema = z.object({ ok: z.boolean() }).openapi('Ok');
const RegistrationTokenSchema = z
  .object({ registrationToken: z.string() })
  .openapi('RegistrationTokenResponse');
const TokensSchema = z
  .object({ accessToken: z.string(), refreshToken: z.string() })
  .openapi('TokensResponse');

const body = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } });
const res = (description: string, schema: z.ZodTypeAny) => ({
  description,
  content: { 'application/json': { schema } },
});
const err = (description: string) => res(description, ErrorResponseSchema);

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/register/start',
  tags: ['App Pasajero', 'App Conductor'],
  summary: 'Registro 1/3 — envía OTP al correo',
  request: { body: body(RegisterStartSchema) },
  responses: {
    202: res('Código enviado', MensajeSchema),
    400: err('Datos inválidos'),
    409: err('El correo ya está registrado'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/register/verify',
  tags: ['App Pasajero', 'App Conductor'],
  summary: 'Registro 2/3 — verifica el OTP del correo y entrega un token de registro',
  request: { body: body(RegisterVerifySchema) },
  responses: {
    200: res('Token de registro', RegistrationTokenSchema),
    401: err('Código inválido o expirado'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/register/complete',
  tags: ['App Pasajero', 'App Conductor'],
  summary: 'Registro 3/3 — crea la cuenta y abre sesión',
  request: { body: body(RegisterCompleteSchema) },
  responses: {
    201: res('Cuenta creada + sesión', SessionResponseSchema),
    400: err('Datos inválidos'),
    401: err('Token de registro inválido'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login/start',
  tags: ['Compartido'],
  summary: 'Login 1/2 — envía OTP al correo',
  request: { body: body(LoginStartSchema) },
  responses: {
    202: res('Código enviado', MensajeSchema),
    401: err('No existe una cuenta con ese correo'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login/verify',
  tags: ['Compartido'],
  summary: 'Login 2/2 — verifica el OTP del correo y abre sesión',
  request: { body: body(LoginVerifySchema) },
  responses: {
    200: res('Sesión iniciada', SessionResponseSchema),
    401: err('Código inválido o expirado'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  tags: ['Compartido'],
  summary: 'Renueva el access token (rota el refresh)',
  request: { body: body(RefreshSchema) },
  responses: {
    200: res('Nuevos tokens', TokensSchema),
    401: err('Sesión inválida'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Compartido'],
  summary: 'Cierra la sesión (revoca el refresh)',
  request: { body: body(LogoutSchema) },
  responses: { 200: res('Sesión cerrada', MensajeSchema) },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/password',
  tags: ['Compartido'],
  summary: 'Fija o cambia la contraseña del usuario autenticado. Política: mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.',
  security: [{ bearerAuth: [] }],
  request: { body: body(SetPasswordSchema) },
  responses: {
    200: res('Contraseña actualizada', OkSchema),
    400: err('La contraseña no cumple la política'),
    401: err('No autenticado'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login/password',
  tags: ['Compartido'],
  summary: 'Login con correo + contraseña',
  request: { body: body(LoginPasswordSchema) },
  responses: {
    200: res('Sesión iniciada', SessionResponseSchema),
    400: err('Datos inválidos'),
    401: err('Correo o contraseña inválidos'),
  },
});

// ---------------------------------------------------------------------------
// Invitaciones de administradores
// ---------------------------------------------------------------------------

const InvitacionCreadaSchema = z.object({
  idInvitacion: z.number().int(),
  correo: z.string().email(),
  estado: z.string(),
  expiraEn: z.string().datetime(),
}).openapi('InvitacionCreada');

const InvitacionesListaSchema = z.object({
  data: z.array(z.object({
    idInvitacion: z.number().int(),
    correo: z.string().email(),
    estado: z.string(),
    expiraEn: z.string().datetime(),
    invitadoPor: z.number().int(),
    createdAt: z.string().datetime(),
  })),
}).openapi('InvitacionesLista');

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/admin/invitaciones',
  tags: ['Admin'],
  summary: 'Invita a un nuevo admin por correo (crea/reenvía + email)',
  security: [{ bearerAuth: [] }],
  request: { body: body(CrearInvitacionSchema) },
  responses: {
    201: res('Invitación creada', InvitacionCreadaSchema),
    403: err('Sin rol admin'),
    409: err('El correo ya está registrado'),
  },
});

openapiRegistry.registerPath({
  method: 'get',
  path: '/api/admin/invitaciones',
  tags: ['Admin'],
  summary: 'Lista las invitaciones de admin',
  security: [{ bearerAuth: [] }],
  responses: {
    200: res('Lista de invitaciones', InvitacionesListaSchema),
    403: err('Sin rol admin'),
  },
});

openapiRegistry.registerPath({
  method: 'delete',
  path: '/api/admin/invitaciones/{id}',
  tags: ['Admin'],
  summary: 'Revoca una invitación pendiente',
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: 'Revocada' },
    403: err('Sin rol admin'),
    404: err('No encontrada'),
    409: err('Ya aceptada'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/invitaciones/aceptar',
  tags: ['Admin'],
  summary: 'Acepta la invitación: fija contraseña, crea el admin y abre sesión',
  request: { body: body(AceptarInvitacionSchema) },
  responses: {
    200: res('Admin creado + sesión', SessionResponseSchema),
    400: err('Token inválido/vencido/revocado o password débil'),
    409: err('El correo ya fue tomado'),
  },
});
