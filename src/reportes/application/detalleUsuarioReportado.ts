import type { IReporteRepository, DetalleUsuarioReportado } from '../domain/repositories/IReporteRepository.js';
import type { RolReportado } from '../domain/Reporte.js';
import { NotFoundError } from '../../core/errors.js';

/** Detalle admin de un usuario reportado en un rol (contacto + sus reportes de ese rol). */
export function detalleUsuarioReportado(deps: {
  reportes: Pick<IReporteRepository, 'detalleUsuarioReportado'>;
}) {
  return async (idUsuario: number, rol: RolReportado): Promise<DetalleUsuarioReportado> => {
    const detalle = await deps.reportes.detalleUsuarioReportado(idUsuario, rol);
    if (!detalle) throw new NotFoundError('Usuario');
    return detalle;
  };
}
