import type { Coordenada } from '../domain/tipos.js';
import type { IRouteEstimator } from '../domain/ports/IRouteEstimator.js';

const R = 6371; // km
const FACTOR_VIAL = 1.3;
const VEL_MEDIA_KMH = 20;
const rad = (g: number) => (g * Math.PI) / 180;

export class HaversineRouteEstimator implements IRouteEstimator {
  async estimar(o: Coordenada, d: Coordenada): Promise<{ distanciaKm: number; duracionMin: number }> {
    const dLat = rad(d.lat - o.lat);
    const dLng = rad(d.lng - o.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(o.lat)) * Math.cos(rad(d.lat)) * Math.sin(dLng / 2) ** 2;
    const recta = 2 * R * Math.asin(Math.sqrt(a));
    const distanciaKm = Math.round(recta * FACTOR_VIAL * 100) / 100;
    const duracionMin = Math.round((distanciaKm / VEL_MEDIA_KMH) * 60);
    return { distanciaKm, duracionMin };
  }
}
