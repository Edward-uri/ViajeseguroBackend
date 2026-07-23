import type { IReporteRepository, UsuarioReportado } from '../domain/repositories/IReporteRepository.js';

/** Lista paginada de usuarios con reportes, de cualquier rol (contrato uniforme). */
export function listarUsuariosReportados(deps: {
  reportes: Pick<IReporteRepository, 'listarUsuariosConReportes'>;
}) {
  return async (page: number, perPage: number): Promise<{
    data: UsuarioReportado[]; page: number; perPage: number; total: number; totalPages: number;
  }> => {
    const { data, total } = await deps.reportes.listarUsuariosConReportes({
      limit: perPage,
      offset: (page - 1) * perPage,
    });
    return { data, page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
  };
}
