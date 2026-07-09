import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { PostulacionConVacante } from '../domain/Postulacion.js';

export function misPostulaciones(deps: { bolsa: Pick<IBolsaRepository, 'listarMisPostulaciones'> }) {
  return async (idConductor: number): Promise<PostulacionConVacante[]> => {
    return deps.bolsa.listarMisPostulaciones(idConductor);
  };
}
