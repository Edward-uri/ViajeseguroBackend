import type { IReporteRepository } from '../domain/repositories/IReporteRepository.js';
import type { IViajeRepository } from '../../viajes/domain/repositories/IViajeRepository.js';
import type { Reporte, RolReportado } from '../domain/Reporte.js';
import { NoEsTuViajeError, ViajeNoReportableError } from '../domain/errors.js';

/** Crea un reporte a partir de un viaje; el reportado y su rol se derivan del
 *  viaje (igual que evaluarViaje). El par queda bloqueado de inmediato. */
export function crearReporte(deps: {
  reportes: IReporteRepository;
  viajes: Pick<IViajeRepository, 'porId'>;
}) {
  return async (input: {
    idViaje: number;
    idReportante: number;
    motivo: string;
    comentario: string | null;
  }): Promise<Reporte> => {
    const viaje = await deps.viajes.porId(input.idViaje);
    if (!viaje || viaje.idConductor == null) throw new ViajeNoReportableError();

    let idReportado: number;
    let rolReportado: RolReportado;
    if (input.idReportante === viaje.idPasajero) {
      idReportado = viaje.idConductor;
      rolReportado = 'conductor';
    } else if (input.idReportante === viaje.idConductor) {
      idReportado = viaje.idPasajero;
      rolReportado = 'pasajero';
    } else {
      throw new NoEsTuViajeError();
    }

    return deps.reportes.crear({
      idViaje: input.idViaje,
      idReportante: input.idReportante,
      idReportado,
      rolReportado,
      motivo: input.motivo,
      comentario: input.comentario,
    });
  };
}
