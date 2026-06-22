import type { IEstadisticasRepository, StatsHoy } from '../domain/repositories/IEstadisticasRepository.js';

export function getStats(deps: { estadisticas: IEstadisticasRepository }) {
  return (idConductor: number): Promise<StatsHoy> => deps.estadisticas.statsHoy(idConductor);
}
