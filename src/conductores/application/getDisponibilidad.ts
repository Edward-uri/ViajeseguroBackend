import type { IDisponibilidadRepository } from '../domain/repositories/IDisponibilidadRepository.js';
import type { Disponibilidad } from '../domain/Disponibilidad.js';

export function getDisponibilidad(deps: { disponibilidad: IDisponibilidadRepository }) {
  return async (idConductor: number): Promise<Disponibilidad> => {
    const d = await deps.disponibilidad.porConductor(idConductor);
    return d ?? { idConductor, disponible: false, lat: null, lng: null, actualizadoEn: null };
  };
}
