import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './core/env.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { swaggerServe, swaggerSetup, openapiJsonHandler } from './docs/docs.js';
import { authRoutes } from './auth/infrastructure/routes/authRoutes.js';
import { userRoutes } from './users/infrastructure/routes/userRoutes.js';
import { conductorRoutes } from './conductores/infrastructure/routes/conductorRoutes.js';
import { adminConductoresRoutes } from './conductores/infrastructure/routes/adminConductoresRoutes.js';
import { municipioRoutes } from './municipios/infrastructure/routes/municipioRoutes.js';
import { adminMunicipiosRoutes } from './municipios/infrastructure/routes/adminMunicipiosRoutes.js';
import { flotillasRoutes } from './flotillas/infrastructure/routes/flotillasRoutes.js';
import { adminVehiculosRoutes } from './flotillas/infrastructure/routes/adminVehiculosRoutes.js';
import { bolsaRoutes } from './bolsa/infrastructure/routes/bolsaRoutes.js';
import { viajesRoutes, tarifasRoutes, dispositivosRoutes, etiquetasRoutes, eventosDemandaRoutes } from './viajes/infrastructure/routes/viajesRoutes.js';
import { zonasAdminRoutes } from './viajes/infrastructure/routes/zonasAdminRoutes.js';
import { adminInvitacionesRoutes } from './auth/infrastructure/routes/adminInvitacionesRoutes.js';
import { zonasRoutes } from './zonas/zonasRoutes.js';
import { reportesRoutes } from './reportes/infrastructure/routes/reportesRoutes.js';
import { adminReportesRoutes } from './reportes/infrastructure/routes/adminReportesRoutes.js';
import { authGlobal } from './auth/infrastructure/rateLimiters.js';
import { eliminarCuentaController } from './legal/infrastructure/eliminarCuentaController.js';

export function buildApp(): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  // En producción solo orígenes conocidos; en dev/test abierto. Apps nativas (sin header Origin) no pasan por CORS.
  const corsOrigins = (env.CORS_ORIGINS ?? env.ADMIN_PANEL_URL).split(',').map((o) => o.trim());
  app.use(cors({ origin: env.NODE_ENV === 'production' ? corsOrigins : true }));
  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });

  app.get('/eliminar-cuenta', eliminarCuentaController);

  app.use('/api/docs', swaggerServe, swaggerSetup());
  app.get('/api/docs.json', openapiJsonHandler);

  app.use('/api/auth', authGlobal, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/municipios', municipioRoutes);
  app.use('/api/admin', adminMunicipiosRoutes);
  app.use('/api/conductor', conductorRoutes);
  app.use('/api/admin', adminConductoresRoutes);
  app.use('/api/flotillas', flotillasRoutes);
  app.use('/api/admin', adminVehiculosRoutes);
  app.use('/api/bolsa', bolsaRoutes);
  app.use('/api/municipios', tarifasRoutes);
  app.use('/api/admin', zonasAdminRoutes);
  app.use('/api/admin', adminInvitacionesRoutes);
  app.use('/api/viajes', viajesRoutes);
  app.use('/api/reportes', reportesRoutes);
  app.use('/api/admin', adminReportesRoutes);
  app.use('/api/dispositivos', dispositivosRoutes);
  app.use('/api/usuarios', etiquetasRoutes);
  app.use('/api/eventos-demanda', eventosDemandaRoutes);
  app.use('/api/zonas', zonasRoutes);

  app.use(errorMiddleware);

  return app;
}
