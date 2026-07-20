export interface PerimetroGeoJSON {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

/** Fuente externa del límite administrativo de un municipio (ej. OpenStreetMap). */
export interface IPerimetroProvider {
  obtener(nombre: string, estado: string): Promise<PerimetroGeoJSON | null>;
}
