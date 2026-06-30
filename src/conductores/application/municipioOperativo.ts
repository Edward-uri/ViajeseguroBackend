import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';

export function municipioOperativo(deps: { conductores: IConductorRepository }) {
  return async (idConductor: number): Promise<number | null> => {
    return deps.conductores.municipioOperativo(idConductor);
  };
}
