import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';

/** Devuelve el viaje activo del pasajero (solicitado/aceptado/en_curso) o null. */
export function getViajeActivo(deps: { viajes: IViajeRepository }) {
  return async (idPasajero: number): Promise<PublicViaje | null> => {
    const viaje = await deps.viajes.viajeActivoDePasajero(idPasajero);
    return viaje ? viaje.toJSON() : null;
  };
}
