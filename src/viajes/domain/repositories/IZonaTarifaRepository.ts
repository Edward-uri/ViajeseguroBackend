import type { Coordenada } from '../tipos.js';
import type { TarifaZona } from '../Zona.js';

export interface IZonaTarifaRepository {
  listarPorMunicipio(idMunicipio: number): Promise<TarifaZona[]>;
  tarifaDeZona(idZona: number): Promise<{ idMunicipio: number; precio: number } | null>;
  zonaMasCercana(idMunicipio: number, c: Coordenada): Promise<{ idZona: number; precio: number; distanciaKm: number } | null>;
  /** Precio fijo por defecto del municipio (fallback cuando no se resuelve zona). */
  tarifaDefault(idMunicipio: number): Promise<number | null>;
}
