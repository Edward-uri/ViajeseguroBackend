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
import { flotillasRoutes } from './flotillas/infrastructure/routes/flotillasRoutes.js';
import { adminVehiculosRoutes } from './flotillas/infrastructure/routes/adminVehiculosRoutes.js';
import { viajesRoutes, tarifasRoutes, dispositivosRoutes } from './viajes/infrastructure/routes/viajesRoutes.js';
import { zonasAdminRoutes } from './viajes/infrastructure/routes/zonasAdminRoutes.js';
import { adminInvitacionesRoutes } from './auth/infrastructure/routes/adminInvitacionesRoutes.js';
import { authGlobal } from './auth/infrastructure/rateLimiters.js';

export function buildApp(): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });

  app.use('/api/docs', swaggerServe, swaggerSetup());
  app.get('/api/docs.json', openapiJsonHandler);

  app.use('/api/auth', authGlobal, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/municipios', municipioRoutes);
  app.use('/api/conductor', conductorRoutes);
  app.use('/api/admin', adminConductoresRoutes);
  app.use('/api/flotillas', flotillasRoutes);
  app.use('/api/admin', adminVehiculosRoutes);
  app.use('/api/municipios', tarifasRoutes);
  app.use('/api/admin', zonasAdminRoutes);
  app.use('/api/admin', adminInvitacionesRoutes);
  app.use('/api/viajes', viajesRoutes);
  app.use('/api/dispositivos', dispositivosRoutes);

  app.use(errorMiddleware);

  return app;
}
