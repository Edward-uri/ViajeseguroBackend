import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { IPushSender } from '../../viajes/domain/ports/IPushSender.js';
import type { Postulacion } from '../domain/Postulacion.js';
import { VacanteNoEncontradaError, VacanteCerradaError, NoPuedesPostularATuPropiaVacanteError } from '../domain/errors.js';

export function postular(deps: {
  bolsa: Pick<IBolsaRepository, 'vacantePorId' | 'crearPostulacion'>;
  push: IPushSender;
}) {
  return async (input: { idVacante: number; idConductor: number; mensaje: string | null }): Promise<Postulacion> => {
    const vacante = await deps.bolsa.vacantePorId(input.idVacante);
    if (!vacante) throw new VacanteNoEncontradaError();
    if (vacante.estado === 'cerrada') throw new VacanteCerradaError();
    if (vacante.idPropietario === input.idConductor) throw new NoPuedesPostularATuPropiaVacanteError();

    const postulacion = await deps.bolsa.crearPostulacion({
      idVacante: input.idVacante,
      idConductor: input.idConductor,
      mensaje: input.mensaje,
    });

    // Aviso best-effort al dueño de la vacante: la postulación ya quedó registrada.
    try {
      await deps.push.enviar({
        idUsuario: vacante.idPropietario,
        titulo: 'Nueva postulación',
        cuerpo: 'Un conductor se postuló a tu vacante. Revísala en la app.',
        data: { tipo: 'nueva_postulacion', idVacante: String(input.idVacante) },
      });
    } catch {
      // Best-effort.
    }

    return postulacion;
  };
}
