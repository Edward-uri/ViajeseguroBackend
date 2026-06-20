import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';

export function listarMisViajes(deps: { viajes: IViajeRepository }) {
  return async (idPasajero: number): Promise<PublicViaje[]> => {
    const viajes = await deps.viajes.listarPorPasajero(idPasajero);
    return viajes.map((v) => v.toJSON());
  };
}
