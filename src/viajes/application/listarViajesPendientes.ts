import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';

export function listarViajesPendientes(deps: {
  viajes: IViajeRepository;
  municipioDelConductor: (idConductor: number) => Promise<number | null>;
}) {
  return async (idConductor: number): Promise<PublicViaje[]> => {
    const municipio = await deps.municipioDelConductor(idConductor);
    if (municipio == null) return [];
    const viajes = await deps.viajes.listarPendientesPorMunicipio(municipio, idConductor);
    return viajes.map((v) => v.toJSON());
  };
}
