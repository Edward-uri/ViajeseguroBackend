// Smoke de KMS/envelope: correr DENTRO del contenedor desplegado (node scripts/kms-smoke.mjs).
// Verifica: conectividad a AWS KMS (IAM/región/llave), roundtrip de data-key,
// cifrado AES-GCM con esa data-key, y el estado de tenant_keys en la BD.
import 'dotenv/config';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import pg from 'pg';

let fallos = 0;
const check = (nombre, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${nombre}${extra ? ` — ${extra}` : ''}`);
  if (!cond) fallos++;
};

const keyId = process.env.KMS_KEY_ID;
if (!keyId) {
  console.error('✗ KMS_KEY_ID no está en el entorno — este contenedor usaría el provider env, no AWS.');
  process.exit(1);
}
console.log(`KMS_KEY_ID=${keyId} · AWS_REGION=${process.env.AWS_REGION ?? '(no seteada)'}\n`);

// 1) KMS real: generar y des-envolver una data-key
const kms = new KMSClient({});
let plaintext, cifrada;
try {
  const out = await kms.send(new GenerateDataKeyCommand({ KeyId: keyId, KeySpec: 'AES_256' }));
  plaintext = Buffer.from(out.Plaintext);
  cifrada = Buffer.from(out.CiphertextBlob);
  check('KMS GenerateDataKey (IAM + región + llave OK)', plaintext.length === 32);
} catch (e) {
  check('KMS GenerateDataKey', false, e.name + ': ' + e.message);
  process.exit(1);
}
const devuelta = Buffer.from((await kms.send(new DecryptCommand({ CiphertextBlob: cifrada, KeyId: keyId }))).Plaintext);
check('KMS Decrypt devuelve la misma data-key', devuelta.equals(plaintext));

// 2) La data-key cifra/descifra de verdad (AES-256-GCM, igual que EnvelopeCipher)
const iv = randomBytes(12);
const c = createCipheriv('aes-256-gcm', plaintext, iv);
const ct = Buffer.concat([c.update('kms-smoke'), c.final()]);
const d = createDecipheriv('aes-256-gcm', plaintext, iv);
d.setAuthTag(c.getAuthTag());
check('AES-GCM roundtrip con la data-key', Buffer.concat([d.update(ct), d.final()]).toString() === 'kms-smoke');

// 3) Estado de tenant_keys en la BD
const client = new pg.Client({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
await client.connect();
const { rows } = await client.query(
  `SELECT proveedor, count(*) FROM tenant_keys WHERE activa GROUP BY proveedor`,
);
console.log('tenant_keys:', rows.length ? rows.map((r) => `${r.proveedor}=${r.count}`).join(', ') : '(vacía — las llaves se crean al primer uso por municipio)');
check('sin llaves de provider ajeno (no mezclar env y aws-kms)', !rows.some((r) => r.proveedor !== 'aws-kms'));
await client.end();

console.log(fallos ? `\n✗ ${fallos} fallo(s)` : '\n✓ KMS OK: envelope listo con AWS');
process.exit(fallos ? 1 : 0);
