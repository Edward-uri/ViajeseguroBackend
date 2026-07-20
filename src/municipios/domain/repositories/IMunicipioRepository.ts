import type { Municipio } from '../Municipio.js';
import type { PerimetroGeoJSON } from '../IPerimetroProvider.js';

export interface IMunicipioRepository {
  listarActivos(): Promise<Municipio[]>;
  existeActivo(idMunicipio: number): Promise<boolean>;
  /** Límite administrativo (GeoJSON) o null si no está cargado. */
  crear(args: { nombre: string; estado: string; tarifaDefault?: number }): Promise<Municipio>;
  guardarPerimetro(idMunicipio: number, perimetro: PerimetroGeoJSON): Promise<void>;
  perimetroDe(idMunicipio: number): Promise<{ type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } | null>;
}
