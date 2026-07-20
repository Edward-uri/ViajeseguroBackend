import type { Coordenada } from './tipos.js';

/** GeoJSON de límite municipal: coordenadas en [lng, lat] (convención GeoJSON). */
export interface PerimetroGeoJSON {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

function dentroDeAnillo(lng: number, lat: number, anillo: number[][]): boolean {
  let dentro = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i] as [number, number];
    const [xj, yj] = anillo[j] as [number, number];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

function dentroDePoligono(lng: number, lat: number, anillos: number[][][]): boolean {
  // Primer anillo = exterior; los demás son huecos.
  if (!anillos[0] || !dentroDeAnillo(lng, lat, anillos[0])) return false;
  return !anillos.slice(1).some((hueco) => dentroDeAnillo(lng, lat, hueco));
}

/** Ray casting sobre Polygon o MultiPolygon (con soporte de huecos). */
export function puntoEnPerimetro(p: Coordenada, perimetro: PerimetroGeoJSON): boolean {
  if (perimetro.type === 'Polygon') {
    return dentroDePoligono(p.lng, p.lat, perimetro.coordinates as number[][][]);
  }
  return (perimetro.coordinates as number[][][][]).some((pol) => dentroDePoligono(p.lng, p.lat, pol));
}
