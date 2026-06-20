import { z } from 'zod';
import { openapiRegistry, wrapData } from '../../docs/openapiRegistry.js';

export const MunicipioSchema = z
  .object({
    idMunicipio: z.number().int().openapi({ example: 1 }),
    nombre: z.string().openapi({ example: 'Suchiapa' }),
    estado: z.string().openapi({ example: 'Chiapas' }),
  })
  .openapi('Municipio');

openapiRegistry.registerPath({
  method: 'get',
  path: '/api/municipios',
  tags: ['Compartido'],
  summary: 'Catálogo de municipios activos donde opera el servicio',
  description:
    'Público (sin autenticación). Lo consumen la app del pasajero y la del conductor para elegir municipio en el registro.',
  responses: {
    200: {
      description: 'Municipios activos',
      content: { 'application/json': { schema: wrapData(z.array(MunicipioSchema)) } },
    },
  },
});
