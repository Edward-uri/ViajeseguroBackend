import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';

export function listarViajesAsignados(deps: { viajes: IViajeRepository }) {
  return async (idConductor: number): Promise<PublicViaje[]> => {
    const viajes = await deps.viajes.listarPorConductor(idConductor);
    return viajes.map((v) => v.toJSON());
  };
}
