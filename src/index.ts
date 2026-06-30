import http from 'node:http';
import { buildApp } from './server.js';
import { env } from './core/env.js';
import { pool } from './core/db.js';
import { createSocketServer } from './realtime/socketServer.js';
import { socketNotifier } from './viajes/infrastructure/dependencies.js';
import { backfillCifrado } from './infrastructure/crypto/backfill.js';

const app = buildApp();
const server = http.createServer(app);
const io = createSocketServer(server);
socketNotifier.attach(io);

// Cifra PII pendiente (idempotente) antes de servir; un fallo no impide arrancar.
backfillCifrado()
  .catch((e) => console.error('[backfill] error (continuando):', e))
  .finally(() => {
    server.listen(env.PORT, () => {
      console.log(`Backend ViajeSeguro escuchando en :${env.PORT} (${env.NODE_ENV})`);
    });
  });

async function shutdown(signal: string): Promise<void> {
  console.log(`\nRecibido ${signal}, cerrando...`);
  await new Promise<void>((res) => io.close(() => res()));
  console.log('HTTP server cerrado');
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
