import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';

export function municipioOperativo(deps: { conductores: IConductorRepository }) {
  return async (idConductor: number): Promise<number | null> => {
    const conductor = await deps.conductores.findById(idConductor);
    return conductor?.idMunicipio ?? null;
  };
}
