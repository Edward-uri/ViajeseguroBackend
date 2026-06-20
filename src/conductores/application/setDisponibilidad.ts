import type { IDisponibilidadRepository } from '../domain/repositories/IDisponibilidadRepository.js';
import type { Disponibilidad } from '../domain/Disponibilidad.js';

export function setDisponibilidad(deps: { disponibilidad: IDisponibilidadRepository }) {
  return async (idConductor: number, args: { disponible: boolean; lat?: number; lng?: number }): Promise<Disponibilidad> => {
    return deps.disponibilidad.upsert({
      idConductor,
      disponible: args.disponible,
      lat: args.lat ?? null,
      lng: args.lng ?? null,
    });
  };
}
