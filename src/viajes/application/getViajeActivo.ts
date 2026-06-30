import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import { enriquecerViaje, type ViajeDetallado } from './enriquecerViaje.js';

/** Devuelve el viaje activo del pasajero (solicitado/aceptado/en_curso) o null. */
export function getViajeActivo(deps: { viajes: IViajeRepository }) {
  return async (idPasajero: number): Promise<ViajeDetallado | null> => {
    const viaje = await deps.viajes.viajeActivoDePasajero(idPasajero);
    return viaje ? enriquecerViaje(deps.viajes, viaje) : null;
  };
}
