import type { RequestHandler } from 'express';
import { z } from 'zod';
import { direccionesUseCases } from '../dependencies.js';
import { UnauthorizedError, NotFoundError } from '../../../core/errors.js';
import { CrearDireccionSchema } from '../schemas.js';
import { openapiRegistry, ErrorResponseSchema, wrapData } from '../../../docs/openapiRegistry.js';

const DireccionSchema = z
  .object({
    idDireccion: z.number().int(),
    etiqueta: z.string().nullable().openapi({ example: 'Casa' }),
    lat: z.number().nullable(),
    lng: z.number().nullable(),
    texto: z.string().nullable().openapi({ example: 'Calle 5 de Mayo #12' }),
    esFavorita: z.boolean(),
  })
  .openapi('Direccion');

openapiRegistry.registerPath({
  method: 'get', path: '/api/users/direcciones', tags: ['Compartido'],
  summary: 'Direcciones guardadas del usuario (Casa, Trabajo, favoritas)',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'Listado', content: { 'application/json': { schema: wrapData(z.array(DireccionSchema)) } } },
    401: { description: 'Token ausente o invalido', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/users/direcciones', tags: ['Compartido'],
  summary: 'Guarda una dirección (etiqueta opcional: Casa, Trabajo, …)',
  security: [{ bearerAuth: [] }],
  request: { body: { required: true, content: { 'application/json': { schema: CrearDireccionSchema } } } },
  responses: {
    201: { description: 'Creada', content: { 'application/json': { schema: wrapData(DireccionSchema) } } },
    400: { description: 'Datos invalidos', content: { 'application/json': { schema: ErrorResponseSchema } } },
    401: { description: 'Token ausente o invalido', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

openapiRegistry.registerPath({
  method: 'delete', path: '/api/users/direcciones/{id}', tags: ['Compartido'],
  summary: 'Elimina una dirección guardada del usuario',
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: 'Eliminada' },
    404: { description: 'No existe o no es del usuario', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const listarDireccionesController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    res.json({ data: await direccionesUseCases.listar(req.user.sub) });
  } catch (e) { next(e); }
};

export const crearDireccionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const dto = CrearDireccionSchema.parse(req.body);
    const creada = await direccionesUseCases.crear(req.user.sub, {
      etiqueta: dto.etiqueta ?? null,
      lat: dto.lat,
      lng: dto.lng,
      texto: dto.texto ?? null,
      esFavorita: dto.esFavorita ?? false,
    });
    res.status(201).json({ data: creada });
  } catch (e) { next(e); }
};

export const eliminarDireccionController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new UnauthorizedError();
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Direccion');
    const ok = await direccionesUseCases.eliminar(req.user.sub, id);
    if (!ok) throw new NotFoundError('Direccion');
    res.status(204).end();
  } catch (e) { next(e); }
};
