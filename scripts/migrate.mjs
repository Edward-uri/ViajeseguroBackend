import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isSeed = process.argv[2] === '--seed';
const target = join(root, 'db', isSeed ? 'seeds' : 'migrations');

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

await client.connect();
// Lock global: si dos contenedores arrancan a la vez, solo uno migra; el otro espera
// y al entrar ve todo aplicado (skip). Se libera solo al cerrar la conexión.
await client.query('SELECT pg_advisory_lock(810214)');
await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
  nombre text PRIMARY KEY, aplicada_en timestamptz NOT NULL DEFAULT now()
)`);

const files = readdirSync(target).filter((f) => f.endsWith('.sql')).sort();
for (const file of files) {
  const { rowCount } = await client.query('SELECT 1 FROM _migrations WHERE nombre = $1', [file]);
  if (rowCount) { console.log(`= skip ${file}`); continue; }
  console.log(`+ aplicando ${file}`);
  await client.query(readFileSync(join(target, file), 'utf8'));
  await client.query('INSERT INTO _migrations(nombre) VALUES ($1)', [file]);
}
await client.end();
console.log(isSeed ? 'seeds OK' : 'migraciones OK');
