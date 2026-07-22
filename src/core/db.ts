import pg from 'pg';
import { env } from './env.js';
import { tenantActual, type TenantContext } from './tenantContext.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err: Error) => {
  console.error('[pg pool] error inesperado', err);
});


async function aplicarContextoTenant(client: pg.PoolClient, ctx: TenantContext): Promise<void> {
  await client.query('SELECT set_config($1, $2, true), set_config($3, $4, true), set_config($5, $6, true)', [
    'app.tenant_id', ctx.tenant == null ? '' : String(ctx.tenant),
    'app.is_admin', ctx.isAdmin ? 'on' : 'off',
    'app.user_id', ctx.userId == null ? '' : String(ctx.userId),
  ]);
}

const queryDirecto = pool.query.bind(pool) as (
  text: string,
  params?: unknown[],
) => Promise<pg.QueryResult>;
async function tenantAwareQuery(text: string, params?: unknown[]): Promise<pg.QueryResult> {
  const ctx = tenantActual();
  if (!ctx) return queryDirecto(text, params);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await aplicarContextoTenant(client, ctx);
    const res = await client.query(text, params);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* conexión caída: release la descarta */ }
    throw err;
  } finally {
    client.release();
  }
}
pool.query = tenantAwareQuery as typeof pool.query;

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ctx = tenantActual();
    if (ctx) await aplicarContextoTenant(client, ctx);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
