import { Redis } from 'ioredis';
import { env } from '../core/env.js';

/** Cliente Redis para rate-limiting. `null` si no hay REDIS_URL (dev/test → MemoryStore). */
export const redis: Redis | null = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { enableOfflineQueue: false, maxRetriesPerRequest: 1, lazyConnect: false })
  : null;

redis?.on('error', (err: Error) => {
  console.warn('[redis] error de conexion (rate-limit fail-open):', err.message);
});
