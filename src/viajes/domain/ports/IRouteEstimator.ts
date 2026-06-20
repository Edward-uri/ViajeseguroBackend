import type { Coordenada } from '../tipos.js';

export interface IRouteEstimator {
  estimar(origen: Coordenada, destino: Coordenada): Promise<{ distanciaKm: number; duracionMin: number }>;
}
