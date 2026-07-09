import { z } from 'zod';
import { openapiRegistry, ErrorResponseSchema } from '../../docs/openapiRegistry.js';
import { CrearVacanteSchema, PostularSchema } from './schemas.js';

const EstadoVacanteSchema = z.enum(['abierta', 'cerrada']).openapi('EstadoVacante');
const EstadoPostulacionSchema = z.enum(['pendiente', 'aceptada', 'rechazada', 'retirada']).openapi('EstadoPostulacion');

const VacanteSchema = z
  .object({
    idVacante: z.number().int(),
    idPropietario: z.number().int(),
    idVehiculo: z.number().int(),
    idMunicipio: z.number().int(),
    condiciones: z.string().nullable(),
    estado: EstadoVacanteSchema,
  })
  .openapi('Vacante');

const VacanteConVehiculoSchema = VacanteSchema.extend({
  placa: z.string(),
  modelo: z.string().nullable(),
  color: z.string().nullable(),
  anio: z.number().int().nullable(),
}).openapi('VacanteConVehiculo');

const VacanteConPendientesSchema = VacanteSchema.extend({
  postulacionesPendientes: z.number().int(),
}).openapi('VacanteConPendientes');

const ConductorPublicoSchema = z
  .object({
    nombre: z.string().nullable(),
    calificacion: z.number().nullable(),
    fotoUrl: z.string().nullable(),
  })
  .openapi('ConductorPublico');

const PostulacionSchema = z
  .object({
    idPostulacion: z.number().int(),
    idVacante: z.number().int(),
    idConductor: z.number().int(),
    estado: EstadoPostulacionSchema,
    mensaje: z.string().nullable(),
  })
  .openapi('Postulacion');

const PostulacionConConductorSchema = PostulacionSchema.extend({
  conductor: ConductorPublicoSchema,
}).openapi('PostulacionConConductor');

const PostulacionConVacanteSchema = PostulacionSchema.extend({
  idVehiculo: z.number().int(),
  idMunicipio: z.number().int(),
  estadoVacante: EstadoVacanteSchema,
}).openapi('PostulacionConVacante');

const ParamsId = z.object({ id: z.string().openapi({ example: '7' }) });
const err = (description: string) => ({ description, content: { 'application/json': { schema: ErrorResponseSchema } } });

openapiRegistry.registerPath({
  method: 'post', path: '/api/bolsa/vacantes', tags: ['Bolsa de Trabajo'],
  summary: 'Publica una vacante para un vehículo propio (propietario)', security: [{ bearerAuth: [] }],
  request: { body: { content: { 'application/json': { schema: CrearVacanteSchema } } } },
  responses: {
    201: { description: 'Vacante creada', content: { 'application/json': { schema: VacanteSchema } } },
    401: err('No autenticado'), 403: err('Rol no autorizado o no es tu vehículo'), 404: err('Vehículo no encontrado'),
    409: err('Ya tienes una vacante abierta para este vehículo'),
  },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/bolsa/vacantes', tags: ['Bolsa de Trabajo'],
  summary: 'Lista vacantes abiertas de un municipio (conductor)', security: [{ bearerAuth: [] }],
  request: { query: z.object({ municipio: z.string().openapi({ example: '1' }) }) },
  responses: {
    200: { description: 'Vacantes abiertas', content: { 'application/json': { schema: z.object({ data: z.array(VacanteConVehiculoSchema) }) } } },
    401: err('No autenticado'), 403: err('Rol no autorizado'),
  },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/bolsa/mis-vacantes', tags: ['Bolsa de Trabajo'],
  summary: 'Lista mis vacantes con conteo de postulaciones pendientes (propietario)', security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Mis vacantes', content: { 'application/json': { schema: z.object({ data: z.array(VacanteConPendientesSchema) }) } } },
    401: err('No autenticado'), 403: err('Rol no autorizado'),
  },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/bolsa/vacantes/{id}/cerrar', tags: ['Bolsa de Trabajo'],
  summary: 'Cierra una vacante propia (propietario dueño)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: {
    200: { description: 'Vacante cerrada', content: { 'application/json': { schema: VacanteSchema } } },
    401: err('No autenticado'), 403: err('No es tu vacante'), 404: err('Vacante no encontrada'),
  },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/bolsa/vacantes/{id}/postular', tags: ['Bolsa de Trabajo'],
  summary: 'Postula a una vacante abierta (conductor); re-postular tras retirar una postulación propia está permitido',
  security: [{ bearerAuth: [] }],
  request: { params: ParamsId, body: { content: { 'application/json': { schema: PostularSchema } } } },
  responses: {
    201: { description: 'Postulación creada', content: { 'application/json': { schema: PostulacionSchema } } },
    401: err('No autenticado'), 403: err('Rol no autorizado o no puedes postular a tu propia vacante'),
    404: err('Vacante no encontrada'),
    409: err('Vacante cerrada o ya postulaste a esta vacante'),
  },
});

openapiRegistry.registerPath({
  method: 'delete', path: '/api/bolsa/postulaciones/{id}', tags: ['Bolsa de Trabajo'],
  summary: 'Retira una postulación propia (conductor dueño; marca "retirada", no borra)', security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: {
    200: { description: 'Postulación retirada', content: { 'application/json': { schema: PostulacionSchema } } },
    401: err('No autenticado'), 403: err('No es tu postulación'), 404: err('Postulación no encontrada'),
  },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/bolsa/vacantes/{id}/postulaciones', tags: ['Bolsa de Trabajo'],
  summary: 'Lista postulaciones de una vacante propia con datos públicos del conductor (propietario dueño)',
  security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: {
    200: { description: 'Postulaciones', content: { 'application/json': { schema: z.object({ data: z.array(PostulacionConConductorSchema) }) } } },
    401: err('No autenticado'), 403: err('No es tu vacante'), 404: err('Vacante no encontrada'),
  },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/bolsa/postulaciones/{id}/aceptar', tags: ['Bolsa de Trabajo'],
  summary: 'Acepta una postulación de una vacante propia (propietario dueño): asigna el vehículo al conductor '
    + '(origen "bolsa"), rechaza las demás postulaciones pendientes de la vacante y la cierra',
  security: [{ bearerAuth: [] }],
  request: { params: ParamsId },
  responses: {
    200: {
      description: 'Postulación aceptada',
      content: { 'application/json': { schema: z.object({ postulacion: PostulacionSchema, vacante: VacanteSchema }) } },
    },
    401: err('No autenticado'), 403: err('No es tu vacante'), 404: err('Postulación no encontrada'),
    409: err('La postulación ya no está pendiente o la vacante ya está cerrada'),
  },
});

openapiRegistry.registerPath({
  method: 'get', path: '/api/bolsa/mis-postulaciones', tags: ['Bolsa de Trabajo'],
  summary: 'Lista mis postulaciones (conductor)', security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Mis postulaciones', content: { 'application/json': { schema: z.object({ data: z.array(PostulacionConVacanteSchema) }) } } },
    401: err('No autenticado'), 403: err('Rol no autorizado'),
  },
});
