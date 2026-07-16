import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
await client.connect();

const { rows: rls } = await client.query(
  `SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'viajes'`,
);
if (!rls[0]?.relrowsecurity || !rls[0]?.relforcerowsecurity) {
  console.error('✗ viajes sin RLS+FORCE. Corre primero: node scripts/migrate.mjs');
  await client.end();
  process.exit(1);
}

const setCtx = (tenant, admin) =>
  client.query(`SELECT set_config('app.tenant_id', $1, true), set_config('app.is_admin', $2, true)`, [
    tenant == null ? '' : String(tenant),
    admin ? 'on' : 'off',
  ]);

let fallos = 0;
const check = (nombre, cond) => {
  console.log(`${cond ? '✓' : '✗'} ${nombre}`);
  if (!cond) fallos++;
};

await client.query('BEGIN');
try {
  await setCtx(null, true); // seed como admin (bypass)
  const { rows: [mA] } = await client.query(
    `INSERT INTO municipios (nombre, estado) VALUES ('RLS-Smoke-A', '_test') RETURNING id_municipio`,
  );
  const { rows: [mB] } = await client.query(
    `INSERT INTO municipios (nombre, estado) VALUES ('RLS-Smoke-B', '_test') RETURNING id_municipio`,
  );
  const { rows: [u] } = await client.query(`INSERT INTO usuarios DEFAULT VALUES RETURNING id_usuario`);
  await client.query(
    `INSERT INTO viajes (id_pasajero, id_municipio, tarifa) VALUES ($1, $2, 20), ($1, $3, 20)`,
    [u.id_usuario, mA.id_municipio, mB.id_municipio],
  );

  const visibles = async () =>
    Number(
      (
        await client.query(`SELECT count(*) FROM viajes WHERE id_municipio IN ($1, $2)`, [
          mA.id_municipio,
          mB.id_municipio,
        ])
      ).rows[0].count,
    );

  await setCtx(mA.id_municipio, false);
  check('tenant A ve solo su viaje', (await visibles()) === 1);

  await setCtx(mB.id_municipio, false);
  check('tenant B ve solo su viaje', (await visibles()) === 1);

  await setCtx(null, false);
  check('sin tenant (falla cerrado): 0 viajes', (await visibles()) === 0);

  await setCtx(null, true);
  check('admin ve ambos (bypass)', (await visibles()) === 2);

  await setCtx(mA.id_municipio, false);
  await client.query('SAVEPOINT sp');
  let bloqueado = false;
  try {
    await client.query(`INSERT INTO viajes (id_pasajero, id_municipio, tarifa) VALUES ($1, $2, 20)`, [
      u.id_usuario,
      mB.id_municipio,
    ]);
  } catch (e) {
    bloqueado = e.code === '42501'; // new row violates row-level security policy
    await client.query('ROLLBACK TO sp');
  }
  check('tenant A NO puede escribir en municipio B (WITH CHECK)', bloqueado);
} finally {
  await client.query('ROLLBACK'); // nada persiste
  await client.end();
}

console.log(fallos ? `\n✗ ${fallos} fallo(s) de aislamiento` : '\n✓ RLS OK: aislamiento por municipio verificado');
process.exit(fallos ? 1 : 0);
