import { buildApp } from './server.js';
import { env } from './core/env.js';
import { pool } from './core/db.js';

const app = buildApp();

const server = app.listen(env.PORT, () => {
  console.log(`Backend ViajeSeguro escuchando en :${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\nRecibido ${signal}, cerrando...`);
  server.close(() => console.log('HTTP server cerrado'));
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
