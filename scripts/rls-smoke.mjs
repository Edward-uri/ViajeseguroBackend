import 'dotenv/config';
import pg from 'pg';

const TABLAS_RLS = [
  'viajes', 'vehiculos', 'conductores', 'vacantes',
  'rastreo_ubicacion', 'viaje_estado_historial', 'viaje_rechazos', 'evaluaciones',
  'documentos_conductor', 'conductor_disponibilidad', 'conductor_sesiones', 'conductor_cambio_estatus',
  'documentos_vehiculo', 'asignaciones_conductor_vehiculo', 'vehiculo_cambio_estatus',
  'postulaciones',
];

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
await client.connect();

const { rows: [yo] } = await client.query(`SELECT rolsuper FROM pg_roles WHERE rolname = current_user`);
if (yo.rolsuper) {
  console.error('✗ Conectado como SUPERUSUARIO: Postgres ignora RLS y el test no mide nada. Usa un rol sin privilegios.');
  await client.end();
  process.exit(1);
}

for (const tabla of TABLAS_RLS) {
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

const primerEnum = async (tipo) =>
  (await client.query(`SELECT unnest(enum_range(NULL::${tipo}))::text AS v LIMIT 1`)).rows[0].v;

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

  const uPasajero = await usuario();
  const { rows: viajes } = await client.query(
    `INSERT INTO viajes (id_pasajero, id_municipio, tarifa) VALUES ($1, $2, 20), ($1, $3, 20) RETURNING id_viaje`,
    [uPasajero, mA.id_municipio, mB.id_municipio],
  );
  const [viA, viB] = viajes.map((r) => r.id_viaje);

  const uProp = await usuario();
  await client.query(`INSERT INTO propietarios (id_propietario) VALUES ($1)`, [uProp]);
  const vehiculo = async (placa, mun) =>
    (await client.query(
      `INSERT INTO vehiculos (id_propietario, placa, id_municipio) VALUES ($1, $2, $3) RETURNING id_vehiculo`,
      [uProp, placa, mun],
    )).rows[0].id_vehiculo;
  const vA = await vehiculo('RLS-SMK-A', mA.id_municipio);
  const vB = await vehiculo('RLS-SMK-B', mB.id_municipio);

  const { rows: vacantes } = await client.query(
    `INSERT INTO vacantes (id_propietario, id_vehiculo, id_municipio) VALUES ($1, $2, $3), ($1, $4, $5) RETURNING id_vacante`,
    [uProp, vA, mA.id_municipio, vB, mB.id_municipio],
  );
  const [vacA, vacB] = vacantes.map((r) => r.id_vacante);

  const conductor = async (mun) => {
    const u = await usuario();
    await client.query(`INSERT INTO conductores (id_conductor, id_municipio) VALUES ($1, $2)`, [u, mun]);
    return u;
  };
  const cA = await conductor(mA.id_municipio);
  const cB = await conductor(mB.id_municipio);

  // hijas: una fila por municipio en cada tabla
  const tipoDoc = await primerEnum('tipo_documento');
  const tipoDocVe = await primerEnum('tipo_documento_vehiculo');
  const estatusC = await primerEnum('estatus_conductor');
  const estatusV = await primerEnum('estatus_vehiculo');
  const estadoViaje = await primerEnum('estado_viaje');

  for (const [c, v, vi] of [[cA, vA, viA], [cB, vB, viB]]) {
    await client.query(
      `INSERT INTO documentos_conductor (id_conductor, tipo, archivo_key, mime_type, tamano_bytes) VALUES ($1, $2, 'rls-smoke', 'image/png', 1)`,
      [c, tipoDoc],
    );
    await client.query(`INSERT INTO conductor_disponibilidad (id_conductor) VALUES ($1)`, [c]);
    await client.query(`INSERT INTO conductor_sesiones (id_conductor) VALUES ($1)`, [c]);
    await client.query(`INSERT INTO conductor_cambio_estatus (id_conductor, estatus) VALUES ($1, $2)`, [c, estatusC]);
    await client.query(
      `INSERT INTO documentos_vehiculo (id_vehiculo, tipo, archivo_key, mime_type, tamano_bytes) VALUES ($1, $2, 'rls-smoke', 'image/png', 1)`,
      [v, tipoDocVe],
    );
    await client.query(`INSERT INTO asignaciones_conductor_vehiculo (id_vehiculo, id_conductor) VALUES ($1, $2)`, [v, c]);
    await client.query(`INSERT INTO vehiculo_cambio_estatus (id_vehiculo, estatus) VALUES ($1, $2)`, [v, estatusV]);
    await client.query(`INSERT INTO viaje_rechazos (id_viaje, id_conductor) VALUES ($1, $2)`, [vi, c]);
    await client.query(`INSERT INTO viaje_estado_historial (id_viaje, estado) VALUES ($1, $2)`, [vi, estadoViaje]);
    await client.query(`INSERT INTO rastreo_ubicacion (id_viaje, lat, lng) VALUES ($1, 16.75, -93.11)`, [vi]);
    await client.query(
      `INSERT INTO evaluaciones (id_viaje, id_evaluador, id_evaluado, tipo, calificacion) VALUES ($1, $2, $3, 'pasajero_a_conductor', 5)`,
      [vi, uPasajero, c],
    );
  }
  await client.query(`INSERT INTO postulaciones (id_vacante, id_conductor) VALUES ($1, $2), ($3, $4)`, [vacA, cA, vacB, cB]);

  const CASOS = [
    { tabla: 'viajes', where: 'id_municipio IN ($1, $2)', params: [mA.id_municipio, mB.id_municipio] },
    { tabla: 'vehiculos', where: 'id_municipio IN ($1, $2)', params: [mA.id_municipio, mB.id_municipio] },
    { tabla: 'conductores', where: 'id_municipio IN ($1, $2)', params: [mA.id_municipio, mB.id_municipio] },
    { tabla: 'vacantes', where: 'id_municipio IN ($1, $2)', params: [mA.id_municipio, mB.id_municipio] },
    { tabla: 'rastreo_ubicacion', where: 'id_viaje IN ($1, $2)', params: [viA, viB] },
    { tabla: 'viaje_estado_historial', where: 'id_viaje IN ($1, $2)', params: [viA, viB] },
    { tabla: 'viaje_rechazos', where: 'id_viaje IN ($1, $2)', params: [viA, viB] },
    { tabla: 'evaluaciones', where: 'id_viaje IN ($1, $2)', params: [viA, viB] },
    { tabla: 'documentos_conductor', where: 'id_conductor IN ($1, $2)', params: [cA, cB] },
    { tabla: 'conductor_disponibilidad', where: 'id_conductor IN ($1, $2)', params: [cA, cB] },
    { tabla: 'conductor_sesiones', where: 'id_conductor IN ($1, $2)', params: [cA, cB] },
    { tabla: 'conductor_cambio_estatus', where: 'id_conductor IN ($1, $2)', params: [cA, cB] },
    { tabla: 'documentos_vehiculo', where: 'id_vehiculo IN ($1, $2)', params: [vA, vB] },
    { tabla: 'asignaciones_conductor_vehiculo', where: 'id_vehiculo IN ($1, $2)', params: [vA, vB] },
    { tabla: 'vehiculo_cambio_estatus', where: 'id_vehiculo IN ($1, $2)', params: [vA, vB] },
    { tabla: 'postulaciones', where: 'id_vacante IN ($1, $2)', params: [vacA, vacB] },
  ];

  const visibles = async ({ tabla, where, params }) =>
    Number((await client.query(`SELECT count(*) FROM ${tabla} WHERE ${where}`, params)).rows[0].count);

  for (const caso of CASOS) {
    await setCtx(mA.id_municipio, false);
    const soloA = (await visibles(caso)) === 1;
    await setCtx(mB.id_municipio, false);
    const soloB = (await visibles(caso)) === 1;
    await setCtx(null, false);
    const cerrado = (await visibles(caso)) === 0;
    await setCtx(null, true);
    const admin = (await visibles(caso)) === 2;
    check(`${caso.tabla}: A ve 1, B ve 1, sin tenant 0, admin 2`, soloA && soloB && cerrado && admin);
  }

  // WITH CHECK: tenant A no puede escribir en municipio B (directo y vía padre)
  await setCtx(mA.id_municipio, false);
  await client.query('SAVEPOINT sp');
  let bloqueadoDirecto = false;
  try {
    await client.query(`INSERT INTO viajes (id_pasajero, id_municipio, tarifa) VALUES ($1, $2, 20)`, [uPasajero, mB.id_municipio]);
  } catch (e) {
    bloqueadoDirecto = e.code === '42501';
    await client.query('ROLLBACK TO sp');
  }
  check('WITH CHECK directo: tenant A no escribe viaje en municipio B', bloqueadoDirecto);

  await client.query('SAVEPOINT sp2');
  let bloqueadoHija = false;
  try {
    await client.query(`INSERT INTO rastreo_ubicacion (id_viaje, lat, lng) VALUES ($1, 0, 0)`, [viB]);
  } catch (e) {
    bloqueadoHija = e.code === '42501';
    await client.query('ROLLBACK TO sp2');
  }
  check('WITH CHECK vía padre: tenant A no escribe rastreo de un viaje de B', bloqueadoHija);
} finally {
  await client.query('ROLLBACK'); // nada persiste
  await client.end();
}

console.log(fallos ? `\n✗ ${fallos} fallo(s) de aislamiento` : `\n✓ RLS OK: aislamiento verificado en ${TABLAS_RLS.length} tablas`);
process.exit(fallos ? 1 : 0);
