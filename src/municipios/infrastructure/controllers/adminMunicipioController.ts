import type { RequestHandler } from 'express';
import { z } from 'zod';
import { municipioUseCases } from '../dependencies.js';
import { openapiRegistry, ErrorResponseSchema, wrapData } from '../../../docs/openapiRegistry.js';
import { MunicipioSchema } from '../openapi.js';

export const CrearMunicipioSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
  estado: z.string().trim().min(1).max(80),
  tarifaDefault: z.number().finite().positive().max(999999.99).optional(),
});

openapiRegistry.registerPath({
  method: 'post', path: '/api/admin/municipios', tags: ['Admin'],
  summary: 'Alta de municipio (intenta cargar su límite desde OSM en el mismo paso)',
  security: [{ bearerAuth: [] }],
  request: { body: { required: true, content: { 'application/json': { schema: CrearMunicipioSchema } } } },
  responses: {
    201: {
      description: 'Municipio creado; perimetroCargado indica si OSM tenía el polígono',
      content: { 'application/json': { schema: wrapData(z.object({ municipio: MunicipioSchema, perimetroCargado: z.boolean() })) } },
    },
    409: { description: 'Ya existe', content: { 'application/json': { schema: ErrorResponseSchema } } },
  },
});

export const crearMunicipioController: RequestHandler = async (req, res, next) => {
  try {
    const dto = CrearMunicipioSchema.parse(req.body);
    res.status(201).json({ data: await municipioUseCases.crearMunicipio(dto) });
  } catch (e) { next(e); }
};
