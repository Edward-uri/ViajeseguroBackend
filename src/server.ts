import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './core/env.js';
import { errorMiddleware } from './core/errorMiddleware.js';
import { swaggerServe, swaggerSetup } from './core/docs.js';
import { authRoutes } from './users/infrastructure/routes/authRoutes.js';
import { userRoutes } from './users/infrastructure/routes/userRoutes.js';

export function buildApp(): Express {
  const app = express();

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

  // Documentacion OpenAPI / Swagger UI
  app.use('/api/docs', swaggerServe, swaggerSetup());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);

  app.use(errorMiddleware);

  return app;
}
