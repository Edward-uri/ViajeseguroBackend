import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { VacanteConVehiculo } from '../domain/Vacante.js';

export function listarVacantesAbiertas(deps: { bolsa: Pick<IBolsaRepository, 'listarAbiertasPorMunicipio'> }) {
  return async (idMunicipio: number): Promise<VacanteConVehiculo[]> => {
    return deps.bolsa.listarAbiertasPorMunicipio(idMunicipio);
  };
}
