import type { IConductorRepository, ConductorPendiente } from '../domain/repositories/IConductorRepository.js';

export function listConductoresPendientes(deps: { conductores: IConductorRepository }) {
  return async (): Promise<ConductorPendiente[]> => deps.conductores.listarConPendientes();
}
