import { z } from 'zod';
import { openapiRegistry, ErrorResponseSchema } from '../../docs/openapiRegistry.js';
import { PerfilSchema, VehiculoSchema, EditarVehiculoSchema, RevisarDocumentoVehiculoSchema, AsignarConductorSchema, SetVehiculoActivoSchema } from './schemas.js';

const DocItemSchema = z
  .object({
    tipo: z.string(),
    estado: z.enum(['pendiente', 'aprobado', 'rechazado', 'faltante']),
    idDocumento: z.number().int().nullable().optional(),
    motivoRechazo: z.string().nullable().optional(),
  })
  .openapi('DocumentoVehiculoItem');

const VehiculoDetalleSchema = z
  .object({
    idVehiculo: z.number().int(),
    placa: z.string(),
    modelo: z.string().nullable(),
    color: z.string().nullable(),
    anio: z.number().int().nullable(),
    idMunicipio: z.number().int(),
    estadoVerificacion: z.enum(['incompleto', 'en_revision', 'rechazado', 'aprobado']),
    requeridos: z.array(z.string()),
    opcionales: z.array(z.string()),
    documentos: z.array(DocItemSchema),
  })
  .openapi('VehiculoDetalle');

const VehiculoResumenSchema = z
  .object({
    idVehiculo: z.number().int(),
    placa: z.string(),
    modelo: z.string().nullable(),
    color: z.string().nullable(),
    anio: z.number().int().nullable(),
    idMunicipio: z.number().int(),
    estadoVerificacion: z.enum(['incompleto', 'en_revision', 'rechazado', 'aprobado']),
    origen: z.enum(['propio', 'asignado']),
    activo: z.boolean(),
  })
  .openapi('VehiculoResumen');

const SoloArchivoSchema = z
  .object({ archivo: z.string().openapi({ type: 'string', format: 'binary' }) })
  .openapi('SubirArchivoVehiculo');

const ParamsId = z.object({ id: z.string().openapi({ example: '7' }) });
const err = (description: string) => ({ description, content: { 'application/json': { schema: ErrorResponseSchema } } });
const archivoRes = { description: 'Binario del archivo', content: { 'application/octet-stream': { schema: z.string().openapi({ type: 'string', format: 'binary' }) } } };

// ---- Web Flotillas ----
openapiRegistry.registerPath({
  method: 'post', path: '/api/flotillas/propietarios/activar', tags: ['Web Flotillas'],
  summary: 'Activa el rol propietario para la cuenta autenticada (idempotente; requiere refresh de sesión para reflejarse en el token)',
  security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Rol activado', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } }, 401: err('No autenticado') },
});
openapiRegistry.registerPath({
  method: 'get', path: '/api/flotillas/perfil', tags: ['Web Flotillas'],
  summary: 'Perfil del propietario', security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Perfil', content: { 'application/json': { schema: PerfilSchema } } }, 401: err('No autenticado'), 403: err('Rol no autorizado') },
});
openapiRegistry.registerPath({
  method: 'put', path: '/api/flotillas/perfil', tags: ['Web Flotillas'],
  summary: 'Actualiza el perfil del propietario', security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: PerfilSchema } } } },
  responses: { 200: { description: 'Perfil actualizado', content: { 'application/json': { schema: PerfilSchema } } }, 401: err('No autenticado'), 403: err('Rol no autorizado') },
});
openapiRegistry.registerPath({
  method: 'post', path: '/api/flotillas/vehiculos', tags: ['Web Flotillas'],
  summary: 'Registra un vehículo', security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: VehiculoSchema } } } },
  responses: { 201: { description: 'Vehículo creado', content: { 'application/json': { schema: VehiculoSchema } } }, 400: err('Municipio inválido'), 401: err('No autenticado'), 403: err('Rol no autorizado') },
});
openapiRegistry.registerPath({
  method: 'get', path: '/api/flotillas/vehiculos', tags: ['Web Flotillas'],
  summary: 'Lista mis vehículos', security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Vehículos del propietario', content: { 'application/json': { schema: z.object({ data: z.array(VehiculoResumenSchema) }) } } }, 401: err('No autenticado'), 403: err('Rol no autorizado') },
});
openapiRegistry.registerPath({
  method: 'get', path: '/api/flotillas/vehiculos/{id}', tags: ['Web Flotillas'],
  summary: 'Detalle de un vehículo propio + documentos', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: { description: 'Detalle del vehículo', content: { 'application/json': { schema: VehiculoDetalleSchema } } }, 403: err('No es tu vehículo'), 404: err('No encontrado') },
});
openapiRegistry.registerPath({
  method: 'patch', path: '/api/flotillas/vehiculos/{id}', tags: ['Web Flotillas'],
  summary: 'Edita los datos de un vehículo propio', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: { content: { 'application/json': { schema: EditarVehiculoSchema } } } },
  responses: { 200: { description: 'Vehículo actualizado', content: { 'application/json': { schema: VehiculoSchema } } }, 400: err('Datos inválidos'), 403: err('No es tu vehículo'), 404: err('No encontrado') },
});
openapiRegistry.registerPath({
  method: 'patch', path: '/api/flotillas/vehiculos/activo', tags: ['Web Flotillas'],
  summary: 'Selecciona el vehículo activo del conductor (dueño o asignado; no requiere estar aprobado)', security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: SetVehiculoActivoSchema } } } },
  responses: { 200: { description: 'Vehículo activo actualizado', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } }, 400: err('Datos inválidos'), 403: err('No es tu vehículo'), 404: err('No encontrado') },
});

const SUBIDAS: Array<[string, string]> = [
  ['/api/flotillas/vehiculos/{id}/documentos/tarjeta-circulacion', 'la tarjeta de circulación'],
  ['/api/flotillas/vehiculos/{id}/documentos/foto-vehiculo', 'la foto del vehículo con la placa visible'],
  ['/api/flotillas/vehiculos/{id}/documentos/permiso-municipal', 'el permiso/concesión municipal (opcional)'],
];
for (const [path, doc] of SUBIDAS) {
  openapiRegistry.registerPath({
    method: 'post', path, tags: ['Web Flotillas'],
    summary: `Sube ${doc} (multipart/form-data, campo "archivo")`, security: [{ bearerAuth: [] }],
    request: { params: ParamsId, body: { content: { 'multipart/form-data': { schema: SoloArchivoSchema } } } },
    responses: { 201: { description: 'Documento subido (pendiente)', content: { 'application/json': { schema: DocItemSchema } } }, 400: err('Archivo inválido'), 403: err('No es tu vehículo'), 404: err('No encontrado') },
  });
}

openapiRegistry.registerPath({
  method: 'get', path: '/api/flotillas/vehiculos/{id}/documentos/{idDoc}/archivo', tags: ['Web Flotillas'],
  summary: 'Descarga un documento de un vehículo propio', security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().openapi({ example: '7' }), idDoc: z.string().openapi({ example: '12' }) }) },
  responses: { 200: archivoRes, 403: err('No es tu vehículo'), 404: err('No encontrado') },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/flotillas/vehiculos/{id}/conductores', tags: ['Web Flotillas'],
  summary: 'Asigna un conductor a un vehículo propio', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: { content: { 'application/json': { schema: AsignarConductorSchema } } } },
  responses: { 201: { description: 'Asignado', content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } } }, 400: err('Datos inválidos'), 403: err('No es tu vehículo'), 404: err('Vehículo o conductor no encontrado') },
});
openapiRegistry.registerPath({
  method: 'get', path: '/api/flotillas/vehiculos/{id}/conductores', tags: ['Web Flotillas'],
  summary: 'Lista los conductores activos asignados al vehículo', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: { description: 'IDs de conductores', content: { 'application/json': { schema: z.object({ data: z.array(z.number().int()) }) } } }, 403: err('No es tu vehículo'), 404: err('No encontrado') },
});
openapiRegistry.registerPath({
  method: 'delete', path: '/api/flotillas/vehiculos/{id}/conductores/{idConductor}', tags: ['Web Flotillas'],
  summary: 'Revoca la asignación de un conductor (409 si hay un viaje en curso)', security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().openapi({ example: '7' }), idConductor: z.string().openapi({ example: '12' }) }) },
  responses: { 204: { description: 'Revocado' }, 403: err('No es tu vehículo'), 404: err('No encontrado'), 409: err('Hay un viaje en curso; espera a que termine') },
});

// ---- Web Admin ----
openapiRegistry.registerPath({
  method: 'get', path: '/api/admin/vehiculos/pendientes', tags: ['Web Admin'],
  summary: 'Cola de vehículos con documentos pendientes', security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Lista', content: { 'application/json': { schema: z.object({ data: z.array(z.object({ idVehiculo: z.number(), placa: z.string(), propietario: z.string(), telefono: z.string(), documentosPendientes: z.number() })) }) } } }, 403: err('Rol no autorizado') },
});
openapiRegistry.registerPath({
  method: 'get', path: '/api/admin/vehiculos/{id}', tags: ['Web Admin'],
  summary: 'Detalle de un vehículo + sus documentos', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: { description: 'Detalle del vehículo', content: { 'application/json': { schema: VehiculoDetalleSchema } } }, 403: err('Rol no autorizado'), 404: err('No encontrado') },
});
openapiRegistry.registerPath({
  method: 'get', path: '/api/admin/vehiculos/documentos/{id}/archivo', tags: ['Web Admin'],
  summary: 'Descarga un documento de cualquier vehículo', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: archivoRes, 404: err('No encontrado') },
});
openapiRegistry.registerPath({
  method: 'patch', path: '/api/admin/vehiculos/documentos/{id}', tags: ['Web Admin'],
  summary: 'Aprueba o rechaza un documento de vehículo', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: { content: { 'application/json': { schema: RevisarDocumentoVehiculoSchema } } } },
  responses: { 200: { description: 'Documento revisado', content: { 'application/json': { schema: z.object({ documento: DocItemSchema, estadoVerificacion: z.string() }) } } }, 400: err('Datos inválidos'), 404: err('No encontrado') },
});
