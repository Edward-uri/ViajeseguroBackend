import { Redis } from 'ioredis';
import { env } from '../core/env.js';

/** Cliente Redis para rate-limiting. `null` si no hay REDIS_URL (dev/test → MemoryStore). */
export const redis: Redis | null = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      // NO desactivar enableOfflineQueue: rate-limit-redis carga su script Lua en el constructor
      // (al importar el modulo), antes de que la conexion TCP este lista. Con la cola offline
      // apagada, ioredis lanza "Stream isn't writeable" de forma SINCRONA y crashea el proceso
      // (fuera del alcance del fail-open). Con la cola activa (default) ese comando inicial
      // espera a que la conexion este lista.
      maxRetriesPerRequest: 3,
    })
  : null;

redis?.on('error', (err: Error) => {
  console.warn('[redis] error de conexion (rate-limit fail-open):', err.message);
});
