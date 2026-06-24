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

const RutaGeoJSONSchema = z
  .object({
    type: z.literal('LineString'),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  })
  .openapi('RutaGeoJSON');

const EstimacionSchema = z
  .object({
    distanciaKm: z.number(),
    duracionMin: z.number(),
    tarifa: z.number(),
    tarifaEstimada: z.boolean(),
    idZonaDestino: z.number().int().nullable(),
    ruta: RutaGeoJSONSchema.nullable(),
  })
  .openapi('EstimacionViaje');

const ZonaAdminSchema = z
  .object({
    idZona: z.number().int(),
    nombre: z.string(),
    precio: z.number(),
    latCentro: z.number().nullable(),
    lngCentro: z.number().nullable(),
    activo: z.boolean(),
  })
  .openapi('ZonaAdmin');

const CrearZonaBody = z
  .object({
    nombre: z.string().openapi({ example: 'Centro' }),
    precio: z.number().openapi({ example: 25.5 }),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .openapi('CrearZona');

const ParamsMunicipioZonas = z.object({ idMunicipio: z.string().openapi({ example: '1' }) });

const ActualizarZonaBody = z
  .object({
    nombre: z.string().optional(),
    precio: z.number().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    activo: z.boolean().optional(),
  })
  .openapi('ActualizarZona');

const ParamsMunicipioZona = z.object({
  idMunicipio: z.string().openapi({ example: '1' }),
  idZona: z.string().openapi({ example: '7' }),
});

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
  method: 'post', path: '/api/viajes/estimar', tags: ['App Pasajero'],
  summary: 'Estima distancia, duración, tarifa firme y ruta GeoJSON antes de pedir el viaje',
  security: [{ bearerAuth: [] }],
  request: { body: json(CrearViajeSchema) },
  responses: {
    200: ok('Estimación', EstimacionSchema),
    400: err('Municipio inválido / datos inválidos'),
    401: err('No autenticado'),
  },
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
  method: 'get', path: '/api/viajes/pendientes', tags: ['App Conductor'],
  summary: 'Viajes solicitados en mi municipio (para aceptar)', security: [{ bearerAuth: [] }],
  responses: { 200: ok('Pendientes', z.object({ data: z.array(ViajeSchema) })), 401: err('No autenticado'), 403: err('Rol no autorizado') },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/viajes/asignados', tags: ['App Conductor'],
  summary: 'Mis viajes como conductor (activos + historial)', security: [{ bearerAuth: [] }],
  responses: { 200: ok('Asignados', z.object({ data: z.array(ViajeSchema) })), 401: err('No autenticado'), 403: err('Rol no autorizado') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes/{id}/aceptar', tags: ['App Conductor'],
  summary: 'Acepta un viaje (asigna conductor + vehículo)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: json(AceptarViajeSchema) },
  responses: { 200: ok('Viaje aceptado', ViajeSchema), 403: err('Rol no autorizado'), 409: err('Transición inválida') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/viajes/{id}/rechazar', tags: ['App Conductor'],
  summary: 'Rechaza un viaje (lo oculta de mis pendientes; sigue disponible para otros)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 204: { description: 'Viaje rechazado' }, 401: err('No autenticado'), 403: err('Rol no autorizado'), 404: err('Viaje no encontrado') },
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

openapiRegistry.registerPath({
  method: 'get', path: '/api/admin/municipios/{idMunicipio}/zonas', tags: ['Admin Tarifas'],
  summary: 'Lista las zonas del municipio (activas e inactivas)', security: [{ bearerAuth: [] }],
  request: { params: ParamsMunicipioZonas },
  responses: {
    200: ok('Zonas', z.object({ data: z.array(ZonaAdminSchema) })),
    401: err('No autenticado'), 403: err('Rol no autorizado'),
  },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/admin/municipios/{idMunicipio}/zonas', tags: ['Admin Tarifas'],
  summary: 'Crea una zona con su tarifa vigente', security: [{ bearerAuth: [] }],
  request: { params: ParamsMunicipioZonas, body: json(CrearZonaBody) },
  responses: {
    201: ok('Zona creada', z.object({ data: ZonaAdminSchema })),
    400: err('Datos inválidos'), 403: err('Rol no autorizado'),
    404: err('Municipio inexistente'), 409: err('Nombre de zona duplicado'),
  },
});

openapiRegistry.registerPath({
  method: 'patch', path: '/api/admin/municipios/{idMunicipio}/zonas/{idZona}', tags: ['Admin Tarifas'],
  summary: 'Edita nombre / precio / centro / activo de una zona', security: [{ bearerAuth: [] }],
  request: { params: ParamsMunicipioZona, body: json(ActualizarZonaBody) },
  responses: {
    200: ok('Zona actualizada', z.object({ data: ZonaAdminSchema })),
    400: err('Datos inválidos'), 403: err('Rol no autorizado'),
    404: err('Zona inexistente'), 409: err('Nombre de zona duplicado'),
  },
});

openapiRegistry.registerPath({
  method: 'delete', path: '/api/admin/municipios/{idMunicipio}/zonas/{idZona}', tags: ['Admin Tarifas'],
  summary: 'Desactiva (soft delete) una zona', security: [{ bearerAuth: [] }],
  request: { params: ParamsMunicipioZona },
  responses: {
    204: { description: 'Zona desactivada' },
    403: err('Rol no autorizado'), 404: err('Zona inexistente'),
  },
});
