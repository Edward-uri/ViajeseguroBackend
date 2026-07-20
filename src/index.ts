import http from 'node:http';
import { buildApp } from './server.js';
import { env } from './core/env.js';
import { pool } from './core/db.js';
import { runConTenant } from './core/tenantContext.js';
import { createSocketServer } from './realtime/socketServer.js';
import { socketNotifier, viajeUseCases } from './viajes/infrastructure/dependencies.js';
import { backfillCifrado } from './infrastructure/crypto/backfill.js';
import { tenantKeys } from './infrastructure/crypto/cipher.js';

const app = buildApp();
const server = http.createServer(app);
const io = createSocketServer(server);
socketNotifier.attach(io);

const comoSistema = (fn: () => void) => runConTenant({ tenant: null, isAdmin: true }, fn);

comoSistema(() => {
  void tenantKeys.precargar().catch((e) => console.error('[tenant-keys] precarga falló (se sigue con v1):', e));
  backfillCifrado()
    .catch((e) => console.error('[backfill] error (continuando):', e))
    .finally(() => {
      server.listen(env.PORT, () => {
        console.log(`Backend ViajeSeguro escuchando en :${env.PORT} (${env.NODE_ENV})`);
      });
    });
});

const expiracionInterval = setInterval(() => {
  comoSistema(() => {
    void viajeUseCases.expirarViajes().catch((e) => console.error('[expirarViajes] error:', e));
  });
}, 60_000);
expiracionInterval.unref();

const snapshotInterval = setInterval(() => {
  comoSistema(() => {
    void viajeUseCases.tomarSnapshotDisponibilidad().catch((e) => console.error('[snapshot-disponibilidad] error:', e));
  });
}, 5 * 60_000);
snapshotInterval.unref();

if (env.LLM_JALA_URL) {
  const nlpInterval = setInterval(() => {
    comoSistema(() => {
      void viajeUseCases.procesarEvaluacionesNlp().catch((e) => console.error('[nlp] error:', e));
    });
  }, 10 * 60_000);
  nlpInterval.unref();
}

async function shutdown(signal: string): Promise<void> {
  console.log(`\nRecibido ${signal}, cerrando...`);
  await new Promise<void>((res) => io.close(() => res()));
  console.log('HTTP server cerrado');
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
