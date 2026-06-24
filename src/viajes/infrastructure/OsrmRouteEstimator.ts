import type { Coordenada, RutaGeoJSON } from '../domain/tipos.js';
import type { IRouteEstimator } from '../domain/ports/IRouteEstimator.js';

interface OsrmResponse {
  code: string;
  routes?: { distance: number; duration: number; geometry?: RutaGeoJSON }[];
}

/**
 * Estima la ruta consultando un OSRM self-hosted. Ante cualquier falla
 * (timeout, HTTP != 2xx, code != 'Ok' o sin ruta) cae al `fallback`
 * (Haversine): OSRM caído nunca debe tumbar la creación de un viaje.
 */
export class OsrmRouteEstimator implements IRouteEstimator {
  constructor(
    private readonly baseUrl: string,
    private readonly fallback: IRouteEstimator,
    private readonly timeoutMs = 2000,
  ) {}

  async estimar(o: Coordenada, d: Coordenada): Promise<{ distanciaKm: number; duracionMin: number; geometria: RutaGeoJSON | null }> {
    // OSRM usa orden lng,lat (no lat,lng).
    const url = `${this.baseUrl}/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
      const json = (await res.json()) as OsrmResponse;
      const ruta = json.routes?.[0];
      if (json.code !== 'Ok' || !ruta) throw new Error('OSRM sin ruta');
      return {
        distanciaKm: Math.round((ruta.distance / 1000) * 100) / 100,
        duracionMin: Math.round(ruta.duration / 60),
        geometria: ruta.geometry ?? null,
      };
    } catch {
      return this.fallback.estimar(o, d);
    } finally {
      clearTimeout(timer);
    }
  }
}
