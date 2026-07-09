import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { VacanteConPendientes } from '../domain/Vacante.js';

export function misVacantes(deps: { bolsa: Pick<IBolsaRepository, 'listarMisVacantes'> }) {
  return async (idPropietario: number): Promise<VacanteConPendientes[]> => {
    return deps.bolsa.listarMisVacantes(idPropietario);
  };
}
