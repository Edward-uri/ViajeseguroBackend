import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import { ViajeNoEncontradoError, NoEsTuViajeError, ViajeNoCompletadoError } from '../domain/errors.js';
import { ConflictError } from '../../core/errors.js';

export function evaluarViaje(deps: { viajes: IViajeRepository }) {
  return async (
    idViaje: number,
    idEvaluador: number,
    input: { calificacion: number; comentario?: string | null },
  ): Promise<{ ok: true }> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idPasajero !== idEvaluador) throw new NoEsTuViajeError();
    if (viaje.estado !== 'completado' || viaje.idConductor == null) throw new ViajeNoCompletadoError();
    try {
      await deps.viajes.crearEvaluacion({
        idViaje,
        idEvaluador,
        idEvaluado: viaje.idConductor,
        tipo: 'pasajero_a_conductor',
        calificacion: input.calificacion,
        comentario: input.comentario ?? null,
      });
    } catch (e) {
      if (typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505') {
        throw new ConflictError('Ya evaluaste este viaje');
      }
      throw e;
    }
    return { ok: true };
  };
}
