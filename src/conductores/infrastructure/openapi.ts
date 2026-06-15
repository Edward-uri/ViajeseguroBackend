import { z } from 'zod';
import { openapiRegistry, ErrorResponseSchema } from '../../docs/openapiRegistry.js';
import { LicenciaSchema, RevisarDocumentoSchema } from './schemas.js';

const DocItemSchema = z
  .object({
    tipo: z.string(),
    estado: z.enum(['pendiente', 'aprobado', 'rechazado', 'faltante']),
    idDocumento: z.number().int().nullable().optional(),
    motivoRechazo: z.string().nullable().optional(),
  })
  .openapi('DocumentoConductorItem');

const OnboardingSchema = z
  .object({
    estadoVerificacion: z.enum(['incompleto', 'en_revision', 'rechazado', 'aprobado']),
    licencia: z
      .object({ numero: z.string(), expedicion: z.string().nullable(), vence: z.string().nullable() })
      .nullable(),
    requeridos: z.array(z.string()),
    documentos: z.array(DocItemSchema),
  })
  .openapi('OnboardingConductor');

const SoloArchivoSchema = z
  .object({ archivo: z.string().openapi({ type: 'string', format: 'binary' }) })
  .openapi('SubirArchivo');

const ParamsId = z.object({ id: z.string().openapi({ example: '46' }) });
const err = (description: string) => ({ description, content: { 'application/json': { schema: ErrorResponseSchema } } });
const archivoRes = { description: 'Binario del archivo', content: { 'application/octet-stream': { schema: z.string().openapi({ type: 'string', format: 'binary' }) } } };

// ---- App Conductor ----
openapiRegistry.registerPath({
  method: 'post', path: '/api/conductor/onboarding/licencia', tags: ['App Conductor'],
  summary: 'Guarda los datos de la licencia del conductor', security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: LicenciaSchema } } } },
  responses: { 200: { description: 'Licencia guardada', content: { 'application/json': { schema: z.object({ idConductor: z.number() }).passthrough() } } }, 401: err('No autenticado'), 403: err('Rol no autorizado') },
});

const SUBIDAS: Array<[string, string]> = [
  ['/api/conductor/documentos/licencia', 'la licencia de conducir'],
  ['/api/conductor/documentos/ine-frente', 'el INE (frente)'],
  ['/api/conductor/documentos/ine-reverso', 'el INE (reverso)'],
  ['/api/conductor/documentos/tarjeta-circulacion', 'la tarjeta de circulación del vehículo'],
  ['/api/conductor/documentos/foto-vehiculo', 'la foto del vehículo con la placa visible'],
];
for (const [path, doc] of SUBIDAS) {
  openapiRegistry.registerPath({
    method: 'post', path, tags: ['App Conductor'],
    summary: `Sube ${doc} (multipart/form-data, campo "archivo")`, security: [{ bearerAuth: [] }],
    request: { body: { content: { 'multipart/form-data': { schema: SoloArchivoSchema } } } },
    responses: { 201: { description: 'Documento subido (pendiente)', content: { 'application/json': { schema: DocItemSchema } } }, 400: err('Archivo inválido'), 401: err('No autenticado'), 403: err('Rol no autorizado') },
  });
}

openapiRegistry.registerPath({
  method: 'get', path: '/api/conductor/onboarding', tags: ['App Conductor'],
  summary: 'Estado del alta del conductor + documentos', security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Estado del onboarding', content: { 'application/json': { schema: OnboardingSchema } } }, 401: err('No autenticado'), 403: err('Rol no autorizado') },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/conductor/documentos/{id}/archivo', tags: ['App Conductor'],
  summary: 'Descarga un documento propio', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: archivoRes, 403: err('No es tu documento'), 404: err('No encontrado') },
});

// ---- Web Admin ----
openapiRegistry.registerPath({
  method: 'get', path: '/api/admin/conductores/pendientes', tags: ['Web Admin'],
  summary: 'Cola de conductores con documentos pendientes', security: [{ bearerAuth: [] }],
  responses: { 200: { description: 'Lista', content: { 'application/json': { schema: z.object({ data: z.array(z.object({ idConductor: z.number(), nombre: z.string(), telefono: z.string(), documentosPendientes: z.number() })) }) } } }, 403: err('Rol no autorizado') },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/admin/conductores/{id}', tags: ['Web Admin'],
  summary: 'Detalle de un conductor + sus documentos', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: { description: 'Onboarding del conductor', content: { 'application/json': { schema: OnboardingSchema } } }, 403: err('Rol no autorizado') },
});

openapiRegistry.registerPath({
  method: 'patch', path: '/api/admin/documentos/{id}', tags: ['Web Admin'],
  summary: 'Aprueba o rechaza un documento', security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: { content: { 'application/json': { schema: RevisarDocumentoSchema } } } },
  responses: { 200: { description: 'Documento revisado', content: { 'application/json': { schema: z.object({ documento: DocItemSchema, estadoVerificacion: z.string() }) } } }, 400: err('Datos inválidos'), 404: err('No encontrado') },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/admin/documentos/{id}/archivo', tags: ['Web Admin'],
  summary: 'Descarga un documento de cualquier conductor', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: { 200: archivoRes, 404: err('No encontrado') },
});
