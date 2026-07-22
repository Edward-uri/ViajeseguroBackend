import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { TipoTurno, Vacante } from '../domain/Vacante.js';
import { VacanteNoEncontradaError, NoEsTuVacanteError, VacanteCerradaError } from '../domain/errors.js';

/** Edita los términos de una vacante ABIERTA del propietario. */
export function editarVacante(deps: {
  bolsa: Pick<IBolsaRepository, 'vacantePorId' | 'editarVacante'>;
}) {
  return async (input: {
    idVacante: number;
    idPropietario: number;
    tipoTurno: TipoTurno;
    rentaTurno: number;
    dias: string[];
    horario: string | null;
    condiciones: string | null;
  }): Promise<Vacante> => {
    const vacante = await deps.bolsa.vacantePorId(input.idVacante);
    if (!vacante) throw new VacanteNoEncontradaError();
    if (vacante.idPropietario !== input.idPropietario) throw new NoEsTuVacanteError();
    if (vacante.estado !== 'abierta') throw new VacanteCerradaError();

    return deps.bolsa.editarVacante({
      idVacante: input.idVacante,
      tipoTurno: input.tipoTurno,
      rentaTurno: input.rentaTurno,
      dias: input.dias,
      horario: input.horario,
      condiciones: input.condiciones,
    });
  };
}
