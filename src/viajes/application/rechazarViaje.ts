import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import { ViajeNoEncontradoError } from '../domain/errors.js';

export function rechazarViaje(deps: { viajes: IViajeRepository }) {
  return async (idViaje: number, idConductor: number): Promise<void> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    // Idempotente: rechazar algo que ya no está pendiente no es error para la app.
    if (viaje.estado !== 'solicitado') return;
    await deps.viajes.rechazar(idViaje, idConductor);
  };
}
