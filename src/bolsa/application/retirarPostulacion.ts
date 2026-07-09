import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { Postulacion } from '../domain/Postulacion.js';
import { PostulacionNoEncontradaError, NoEsTuPostulacionError } from '../domain/errors.js';

export function retirarPostulacion(deps: { bolsa: Pick<IBolsaRepository, 'postulacionPorId' | 'retirarPostulacion'> }) {
  return async (input: { idPostulacion: number; idConductor: number }): Promise<Postulacion> => {
    const postulacion = await deps.bolsa.postulacionPorId(input.idPostulacion);
    if (!postulacion) throw new PostulacionNoEncontradaError();
    if (postulacion.idConductor !== input.idConductor) throw new NoEsTuPostulacionError();

    return deps.bolsa.retirarPostulacion(input.idPostulacion);
  };
}
