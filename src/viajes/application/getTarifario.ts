import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';
import type { TarifaZona } from '../domain/Zona.js';

export function getTarifario(deps: { zonas: IZonaTarifaRepository }) {
  return (idMunicipio: number): Promise<TarifaZona[]> => deps.zonas.listarPorMunicipio(idMunicipio);
}
