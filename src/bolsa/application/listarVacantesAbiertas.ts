import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { VacanteConVehiculo } from '../domain/Vacante.js';

export function listarVacantesAbiertas(deps: { bolsa: Pick<IBolsaRepository, 'listarAbiertasPorMunicipio'> }) {
  // idUsuarioExcluido: el propio conductor no ve sus vacantes en la bolsa.
  return async (idMunicipio: number, idUsuarioExcluido: number): Promise<VacanteConVehiculo[]> => {
    return deps.bolsa.listarAbiertasPorMunicipio(idMunicipio, idUsuarioExcluido);
  };
}
