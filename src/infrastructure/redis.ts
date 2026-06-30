import { Redis } from 'ioredis';
import { env } from '../core/env.js';

export const redis: Redis | null = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 200, 3000),
    })
  : null;

redis?.on('error', (err: Error) => {
  console.warn('[redis] error de conexion (rate-limit fail-open):', err.message);
});
