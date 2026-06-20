import { z } from 'zod';
import { openapiRegistry, ErrorResponseSchema } from '../../docs/openapiRegistry.js';
import {
  CrearViajeSchema,
  CancelarViajeSchema,
  AceptarViajeSchema,
  EvaluacionSchema,
  DispositivoSchema,
} from './schemas.js';

const ParamsId = z.object({ id: z.string().openapi({ example: '7' }) });
const err = (description: string) => ({ description, content: { 'application/json': { schema: ErrorResponseSchema } } });
const json = (schema: z.ZodTypeAny) => ({ content: { 'application/json': { schema } } });
const ok = (description: string, schema: z.ZodTypeAny) => ({ description, ...json(schema) });

const CoordSchema = z.object({ lat: z.number().nullable(), lng: z.number().nullable(), texto: z.string().nullable() });

const ViajeSchema = z
  .object({
    idViaje: z.number().int(),
    idPasajero: z.number().int(),
    idConductor: z.number().int().nullable(),
    idVehiculo: z.number().int().nullable(),
    idMunicipio: z.number().int(),
    tipoServicio: z.enum(['viaje', 'envio']),
    origen: CoordSchema,
    destino: CoordSchema,
    idZonaDestino: z.number().int().nullable(),
    distanciaKm: z.number().nullable(),
    tarifa: z.number(),
    tarifaEstimada: z.boolean(),
    estado: z.enum(['solicitado', 'aceptado', 'en_curso', 'completado', 'cancelado']),
  })
  .openapi('Viaje');

const TarifaZonaSchema = z.object({ idZona: z.number().int(), nombre: z.string(), precio: z.number() }).openapi('TarifaZona');
const OkSchema = z.object({ ok: z.boolean() });

openapiRegistry.registerPath({
  method: 'get', path: '/api/municipios/{id}/tarifas', tags: ['App Pasajero'],
  summary: 'Tarifario de zonas del municipio (precios fijos)',
  request: { params: ParamsId },
  responses: { 200: ok('Tarifario', z.object({ data: z.array(TarifaZonaSchema) })) },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes', tags: ['App Pasajero'],
  summary: 'Pide un viaje (tarifa fija por zona destino)', security: [{ bearerAuth: [] }],
  request: { body: json(CrearViajeSchema) },
  responses: { 201: ok('Viaje creado', ViajeSchema), 400: err('Municipio inválido'), 401: err('No autenticado') },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/viajes/mios', tags: ['App Pasajero'],
  summary: 'Mis viajes (activos + historial)', security: [{ bearerAuth: [] }],
  responses: { 200: ok('Viajes', z.object({ data: z.array(ViajeSchema) })), 401: err('No autenticado') },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/viajes/{id}', tags: ['App Pasajero'],
  summary: 'Detalle de un viaje (dueño o conductor asignado)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: ok('Viaje', ViajeSchema), 403: err('No es tu viaje'), 404: err('No encontrado') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes/{id}/cancelar', tags: ['App Pasajero'],
  summary: 'Cancela un viaje (solicitado/aceptado)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: json(CancelarViajeSchema) },
  responses: { 200: ok('Viaje cancelado', ViajeSchema), 409: err('Transición inválida') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes/{id}/evaluacion', tags: ['App Pasajero'],
  summary: 'Califica al conductor tras completar el viaje', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: json(EvaluacionSchema) },
  responses: { 200: ok('Evaluación registrada', OkSchema), 409: err('Ya evaluado / no completado') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/dispositivos', tags: ['Compartido'],
  summary: 'Registra el token FCM del dispositivo para push', security: [{ bearerAuth: [] }],
  request: { body: json(DispositivoSchema) },
  responses: { 200: ok('Registrado', OkSchema), 401: err('No autenticado') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes/{id}/aceptar', tags: ['App Conductor'],
  summary: 'Acepta un viaje (asigna conductor + vehículo)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: json(AceptarViajeSchema) },
  responses: { 200: ok('Viaje aceptado', ViajeSchema), 403: err('Rol no autorizado'), 409: err('Transición inválida') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes/{id}/iniciar', tags: ['App Conductor'],
  summary: 'Inicia el viaje (en curso)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: ok('Viaje en curso', ViajeSchema), 409: err('Transición inválida') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes/{id}/completar', tags: ['App Conductor'],
  summary: 'Completa el viaje', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: ok('Viaje completado', ViajeSchema), 409: err('Transición inválida') },
});
