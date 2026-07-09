import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { Vacante } from '../domain/Vacante.js';
import { VacanteNoEncontradaError, NoEsTuVacanteError } from '../domain/errors.js';

export function cerrarVacante(deps: { bolsa: Pick<IBolsaRepository, 'vacantePorId' | 'cerrarVacante'> }) {
  return async (input: { idVacante: number; idPropietario: number }): Promise<Vacante> => {
    const vacante = await deps.bolsa.vacantePorId(input.idVacante);
    if (!vacante) throw new VacanteNoEncontradaError();
    if (vacante.idPropietario !== input.idPropietario) throw new NoEsTuVacanteError();

    return deps.bolsa.cerrarVacante(input.idVacante);
  };
}
