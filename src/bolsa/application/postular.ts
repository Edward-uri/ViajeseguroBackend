import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { Postulacion } from '../domain/Postulacion.js';
import { VacanteNoEncontradaError, VacanteCerradaError, NoPuedesPostularATuPropiaVacanteError } from '../domain/errors.js';

export function postular(deps: { bolsa: Pick<IBolsaRepository, 'vacantePorId' | 'crearPostulacion'> }) {
  return async (input: { idVacante: number; idConductor: number; mensaje: string | null }): Promise<Postulacion> => {
    const vacante = await deps.bolsa.vacantePorId(input.idVacante);
    if (!vacante) throw new VacanteNoEncontradaError();
    if (vacante.estado === 'cerrada') throw new VacanteCerradaError();
    if (vacante.idPropietario === input.idConductor) throw new NoPuedesPostularATuPropiaVacanteError();

    return deps.bolsa.crearPostulacion({
      idVacante: input.idVacante,
      idConductor: input.idConductor,
      mensaje: input.mensaje,
    });
  };
}
