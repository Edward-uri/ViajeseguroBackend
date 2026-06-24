import type { Coordenada, RutaGeoJSON } from '../tipos.js';

export interface IRouteEstimator {
  estimar(origen: Coordenada, destino: Coordenada): Promise<{
    distanciaKm: number;
    duracionMin: number;
    geometria: RutaGeoJSON | null;
  }>;
}
