import type { IReporteRepository, ConductorReportado } from '../domain/repositories/IReporteRepository.js';

/** Lista paginada de conductores con reportes (contrato uniforme de paginación). */
export function listarConductoresReportados(deps: {
  reportes: Pick<IReporteRepository, 'listarConductoresConReportes'>;
}) {
  return async (page: number, perPage: number): Promise<{
    data: ConductorReportado[]; page: number; perPage: number; total: number; totalPages: number;
  }> => {
    const { data, total } = await deps.reportes.listarConductoresConReportes({
      limit: perPage,
      offset: (page - 1) * perPage,
    });
    return { data, page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
  };
}
