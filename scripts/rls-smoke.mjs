import 'dotenv/config';
import pg from 'pg';

const TABLAS = ['viajes', 'vehiculos', 'conductores', 'vacantes'];

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
await client.connect();

const { rows: [yo] } = await client.query(
  `SELECT rolsuper FROM pg_roles WHERE rolname = current_user`,
);
if (yo.rolsuper) {
  console.error('✗ Conectado como SUPERUSUARIO: Postgres ignora RLS y el test no mide nada. Usa un rol sin privilegios.');
  await client.end();
  process.exit(1);
}

for (const tabla of TABLAS) {
  const { rows } = await client.query(
    `SELECT relrowsecurity AND relforcerowsecurity AS ok FROM pg_class WHERE relname = $1`,
    [tabla],
  );
  if (!rows[0]?.ok) {
    console.error(`✗ ${tabla} sin RLS+FORCE. Corre primero: node scripts/migrate.mjs`);
    await client.end();
    process.exit(1);
  }
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

  const usuario = async () =>
    (await client.query(`INSERT INTO usuarios DEFAULT VALUES RETURNING id_usuario`)).rows[0].id_usuario;

  // viajes: un pasajero, un viaje por municipio
  const uPasajero = await usuario();
  await client.query(
    `INSERT INTO viajes (id_pasajero, id_municipio, tarifa) VALUES ($1, $2, 20), ($1, $3, 20)`,
    [uPasajero, mA.id_municipio, mB.id_municipio],
  );

  // vehiculos + vacantes: un propietario, un vehiculo/vacante por municipio
  const uProp = await usuario();
  await client.query(`INSERT INTO propietarios (id_propietario) VALUES ($1)`, [uProp]);
  const { rows: [vA] } = await client.query(
    `INSERT INTO vehiculos (id_propietario, placa, id_municipio) VALUES ($1, 'RLS-SMK-A', $2) RETURNING id_vehiculo`,
    [uProp, mA.id_municipio],
  );
  const { rows: [vB] } = await client.query(
    `INSERT INTO vehiculos (id_propietario, placa, id_municipio) VALUES ($1, 'RLS-SMK-B', $2) RETURNING id_vehiculo`,
    [uProp, mB.id_municipio],
  );
  await client.query(
    `INSERT INTO vacantes (id_propietario, id_vehiculo, id_municipio) VALUES ($1, $2, $3), ($1, $4, $5)`,
    [uProp, vA.id_vehiculo, mA.id_municipio, vB.id_vehiculo, mB.id_municipio],
  );

  // conductores: uno por municipio
  await client.query(`INSERT INTO conductores (id_conductor, id_municipio) VALUES ($1, $2)`, [
    await usuario(), mA.id_municipio,
  ]);
  await client.query(`INSERT INTO conductores (id_conductor, id_municipio) VALUES ($1, $2)`, [
    await usuario(), mB.id_municipio,
  ]);

  const visiblesEn = async (tabla) =>
    Number(
      (
        await client.query(`SELECT count(*) FROM ${tabla} WHERE id_municipio IN ($1, $2)`, [
          mA.id_municipio,
          mB.id_municipio,
        ])
      ).rows[0].count,
    );

  for (const tabla of TABLAS) {
    await setCtx(mA.id_municipio, false);
    const soloA = (await visiblesEn(tabla)) === 1;
    await setCtx(mB.id_municipio, false);
    const soloB = (await visiblesEn(tabla)) === 1;
    await setCtx(null, false);
    const cerrado = (await visiblesEn(tabla)) === 0;
    await setCtx(null, true);
    const admin = (await visiblesEn(tabla)) === 2;
    check(`${tabla}: A ve 1, B ve 1, sin tenant 0, admin 2`, soloA && soloB && cerrado && admin);
  }

  // WITH CHECK: tenant A no puede escribir en municipio B
  await setCtx(mA.id_municipio, false);
  await client.query('SAVEPOINT sp');
  let bloqueado = false;
  try {
    await client.query(`INSERT INTO viajes (id_pasajero, id_municipio, tarifa) VALUES ($1, $2, 20)`, [
      uPasajero,
      mB.id_municipio,
    ]);
  } catch (e) {
    bloqueado = e.code === '42501';
    await client.query('ROLLBACK TO sp');
  }
  check('WITH CHECK: tenant A no puede escribir en municipio B', bloqueado);
} finally {
  await client.query('ROLLBACK'); // nada persiste
  await client.end();
}

console.log(fallos ? `\n✗ ${fallos} fallo(s) de aislamiento` : '\n✓ RLS OK: aislamiento por municipio verificado en ' + TABLAS.join(', '));
process.exit(fallos ? 1 : 0);
