import type { RequestHandler } from 'express';
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { openapiRegistry } from './openapiRegistry.js';
import { env } from '../core/env.js';

// IMPORTANTE: importar los controllers *aqui* (efecto colateral) para que
// se registren sus paths antes de generar el spec.
// Si se agrega un nuevo controller con OpenAPI, agregar el import aqui.
import '../users/infrastructure/controllers/registerUserController.js';
import '../users/infrastructure/controllers/loginUserController.js';
import '../users/infrastructure/controllers/getMeController.js';
import '../users/infrastructure/controllers/presignProfilePhotoController.js';
import '../users/infrastructure/controllers/confirmProfilePhotoController.js';
import '../users/infrastructure/controllers/deleteAccountController.js';

let cachedSpec: ReturnType<OpenApiGeneratorV31['generateDocument']> | null = null;

function buildSpec() {
  if (cachedSpec) return cachedSpec;

  openapiRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  const generator = new OpenApiGeneratorV31(openapiRegistry.definitions);

  cachedSpec = generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'ViajeSeguro API',
      version: '0.1.0',
      description:
        'Backend del proyecto integrador ViajeSeguro (plataforma de moto-taxis para Suchiapa, Chiapas).',
    },
    servers: [
      { url: `http://localhost:${env.PORT}`, description: 'Desarrollo local' },
      { url: 'http://100.51.99.11', description: 'Produccion (EC2)' },
    ],
    tags: [
      { name: 'Health', description: 'Disponibilidad del servicio' },
      { name: 'Auth', description: 'Registro y autenticacion' },
      { name: 'Users', description: 'Operaciones sobre el usuario autenticado' },
    ],
  });

  return cachedSpec;
}

export const swaggerServe: RequestHandler[] = swaggerUi.serve;

export function swaggerSetup(): RequestHandler {
  return swaggerUi.setup(buildSpec(), {
    customSiteTitle: 'ViajeSeguro API',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

export const openapiJsonHandler: RequestHandler = (_req, res) => {
  res.json(buildSpec());
};
