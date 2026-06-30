import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import { ViajeNoEncontradoError, NoEsTuViajeError } from '../domain/errors.js';
import { enriquecerViaje, type ViajeDetallado } from './enriquecerViaje.js';

export function getViaje(deps: { viajes: IViajeRepository }) {
  return async (idViaje: number, idUsuario: number): Promise<ViajeDetallado> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idPasajero !== idUsuario && viaje.idConductor !== idUsuario) throw new NoEsTuViajeError();
    return enriquecerViaje(deps.viajes, viaje);
  };
}
