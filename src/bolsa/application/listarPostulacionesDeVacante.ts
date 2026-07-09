import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { PostulacionConConductor } from '../domain/Postulacion.js';
import { VacanteNoEncontradaError, NoEsTuVacanteError } from '../domain/errors.js';

export function listarPostulacionesDeVacante(deps: {
  bolsa: Pick<IBolsaRepository, 'vacantePorId' | 'listarPostulacionesDeVacante'>;
}) {
  return async (input: { idVacante: number; idPropietario: number }): Promise<PostulacionConConductor[]> => {
    const vacante = await deps.bolsa.vacantePorId(input.idVacante);
    if (!vacante) throw new VacanteNoEncontradaError();
    if (vacante.idPropietario !== input.idPropietario) throw new NoEsTuVacanteError();

    return deps.bolsa.listarPostulacionesDeVacante(input.idVacante);
  };
}
