import type { RequestHandler } from 'express';
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import { openapiRegistry } from './openapiRegistry.js';
import { env } from '../core/env.js';

import '../auth/infrastructure/openapi.js';
import '../conductores/infrastructure/openapi.js';
import '../municipios/infrastructure/openapi.js';
import '../flotillas/infrastructure/openapi.js';
import '../viajes/infrastructure/openapi.js';
import '../bolsa/infrastructure/openapi.js';
import '../users/infrastructure/controllers/getMeController.js';
import '../users/infrastructure/controllers/uploadProfilePhotoController.js';
import '../users/infrastructure/controllers/getProfilePhotoController.js';
import '../users/infrastructure/controllers/deleteAccountController.js';

openapiRegistry.registerPath({
  method: 'get',
  path: '/health',
  tags: ['Salud'],
  summary: 'Disponibilidad del servicio',
  responses: { 200: { description: 'Servicio disponible' } },
});

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
      { url: 'https://api.codigoverse.space', description: 'Producción' },
      { url: `http://localhost:${env.PORT}`, description: 'Desarrollo local' },
    ],
    tags: [
      { name: 'Salud', description: 'Disponibilidad del servicio.' },
      {
        name: 'Compartido',
        description:
          'Endpoints que consumen las TRES aplicaciones (App Pasajero, App Conductor y Web Admin): login, refresh, logout y perfil del usuario autenticado.',
      },
      {
        name: 'App Pasajero',
        description:
          'Endpoints de la app del pasajero (registro como pasajero; próximamente viajes, direcciones y métodos de pago).',
      },
      {
        name: 'App Conductor',
        description:
          'Endpoints de la app del conductor (registro como conductor; próximamente jornadas y servicios asignados).',
      },
      {
        name: 'Web Admin',
        description:
          'Endpoints del panel de administración web (próximamente gestión de usuarios, conductores y aprobaciones).',
      },
      {
        name: 'Web Flotillas',
        description:
          'Endpoints de gestión de flotilla (propietarios): registro de vehículos y carga de documentos del vehículo para revisión. Los consume tanto un panel web de propietarios como la app del conductor (un conductor dueño de motos).',
      },
      {
        name: 'Bolsa de Trabajo',
        description:
          'Endpoints de la bolsa de trabajo: propietarios publican vacantes para sus vehículos y conductores buscan y postulan a ellas.',
      },
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
