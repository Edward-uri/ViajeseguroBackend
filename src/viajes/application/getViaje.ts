import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { ViajeNoEncontradoError, NoEsTuViajeError } from '../domain/errors.js';

export function getViaje(deps: { viajes: IViajeRepository }) {
  return async (idViaje: number, idUsuario: number): Promise<PublicViaje> => {
    const viaje = await deps.viajes.porId(idViaje);
    if (!viaje) throw new ViajeNoEncontradoError();
    if (viaje.idPasajero !== idUsuario && viaje.idConductor !== idUsuario) throw new NoEsTuViajeError();
    return viaje.toJSON();
  };
}
