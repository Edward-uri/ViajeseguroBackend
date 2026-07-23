import type { IReporteRepository, DetalleConductorReportado } from '../domain/repositories/IReporteRepository.js';
import { NotFoundError } from '../../core/errors.js';

/** Detalle admin de un conductor reportado (contacto + sus reportes). */
export function detalleConductorReportado(deps: {
  reportes: Pick<IReporteRepository, 'detalleConductorReportado'>;
}) {
  return async (idConductor: number): Promise<DetalleConductorReportado> => {
    const detalle = await deps.reportes.detalleConductorReportado(idConductor);
    if (!detalle) throw new NotFoundError('Conductor');
    return detalle;
  };
}
