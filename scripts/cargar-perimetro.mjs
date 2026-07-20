// Carga el límite administrativo de un municipio desde OpenStreetMap (Nominatim)
// y lo guarda en municipios.perimetro (GeoJSON). Uso:
//   node scripts/cargar-perimetro.mjs "Suchiapa" "Chiapas"
import 'dotenv/config';
import pg from 'pg';

const [nombre, estado] = process.argv.slice(2);
if (!nombre || !estado) {
  console.error('Uso: node scripts/cargar-perimetro.mjs "<municipio>" "<estado>"');
  process.exit(1);
}

const q = encodeURIComponent(`${nombre}, ${estado}, México`);
const res = await fetch(
  `https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&polygon_geojson=1&limit=5`,
  { headers: { 'User-Agent': 'viajeseguro-backend (carga de perimetro municipal)' } },
);
if (!res.ok) { console.error(`✗ Nominatim respondió ${res.status}`); process.exit(1); }
const resultados = await res.json();
const admin = resultados.find(
  (r) => r.type === 'administrative' && ['Polygon', 'MultiPolygon'].includes(r.geojson?.type),
);
if (!admin) {
  console.error('✗ OSM no tiene el polígono administrativo de ese municipio. Resultados:',
    resultados.map((r) => `${r.type}/${r.geojson?.type}`).join(', '));
  process.exit(1);
}
const puntos = JSON.stringify(admin.geojson).length;
console.log(`✓ OSM: ${admin.display_name} (${admin.geojson.type}, ~${Math.round(puntos / 1024)} KB)`);

const client = new pg.Client({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
await client.connect();
const { rowCount } = await client.query(
  `UPDATE municipios SET perimetro = $1 WHERE nombre = $2 AND estado = $3`,
  [admin.geojson, nombre, estado],
);
await client.end();
if (rowCount === 0) {
  console.error(`✗ No existe el municipio "${nombre}" (${estado}) en la BD — revisa el nombre exacto.`);
  process.exit(1);
}
console.log(`✓ Perímetro guardado para ${nombre}, ${estado} (${rowCount} fila)`);
