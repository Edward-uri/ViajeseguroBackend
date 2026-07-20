import type { IPerimetroProvider, PerimetroGeoJSON } from '../domain/IPerimetroProvider.js';

interface ResultadoNominatim {
  type: string;
  geojson?: { type: string; coordinates: unknown };
}

/** Límite municipal desde Nominatim (OSM). Devuelve null si no hay polígono administrativo. */
export class OsmPerimetroProvider implements IPerimetroProvider {
  async obtener(nombre: string, estado: string): Promise<PerimetroGeoJSON | null> {
    const q = encodeURIComponent(`${nombre}, ${estado}, México`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&polygon_geojson=1&limit=5`,
      { headers: { 'User-Agent': 'viajeseguro-backend (perimetro municipal)' } },
    );
    if (!res.ok) return null;
    const resultados = (await res.json()) as ResultadoNominatim[];
    const admin = resultados.find(
      (r) => r.type === 'administrative' && ['Polygon', 'MultiPolygon'].includes(r.geojson?.type ?? ''),
    );
    return (admin?.geojson as PerimetroGeoJSON | undefined) ?? null;
  }
}
