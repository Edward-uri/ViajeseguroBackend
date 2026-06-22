import type { IDisponibilidadRepository } from '../domain/repositories/IDisponibilidadRepository.js';
import type { ISesionRepository } from '../domain/repositories/ISesionRepository.js';
import type { Disponibilidad } from '../domain/Disponibilidad.js';

export function setDisponibilidad(deps: {
  disponibilidad: IDisponibilidadRepository;
  sesiones: ISesionRepository;
}) {
  return async (
    idConductor: number,
    args: { disponible: boolean; lat?: number; lng?: number },
  ): Promise<Disponibilidad> => {
    const d = await deps.disponibilidad.upsert({
      idConductor,
      disponible: args.disponible,
      lat: args.lat ?? null,
      lng: args.lng ?? null,
    });
    if (args.disponible) await deps.sesiones.abrir(idConductor);
    else await deps.sesiones.cerrar(idConductor);
    return d;
  };
}
