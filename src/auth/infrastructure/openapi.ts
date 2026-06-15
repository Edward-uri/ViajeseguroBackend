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
} from './schemas.js';

const MensajeSchema = z.object({ message: z.string() }).openapi('Mensaje');
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
  summary: 'Registro 1/3 — envía OTP al teléfono',
  request: { body: body(RegisterStartSchema) },
  responses: {
    202: res('Código enviado', MensajeSchema),
    400: err('Datos inválidos'),
    409: err('El teléfono ya está registrado'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/register/verify',
  tags: ['App Pasajero', 'App Conductor'],
  summary: 'Registro 2/3 — verifica el OTP y entrega un token de registro',
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
  summary: 'Login 1/2 — envía OTP a teléfono o correo',
  request: { body: body(LoginStartSchema) },
  responses: {
    202: res('Código enviado', MensajeSchema),
    401: err('No existe una cuenta con ese identificador'),
  },
});

openapiRegistry.registerPath({
  method: 'post',
  path: '/api/auth/login/verify',
  tags: ['Compartido'],
  summary: 'Login 2/2 — verifica el OTP y abre sesión',
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
