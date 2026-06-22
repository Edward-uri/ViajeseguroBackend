import type { IEstadisticasRepository, GananciasRango } from '../domain/repositories/IEstadisticasRepository.js';
import type { ISesionRepository } from '../domain/repositories/ISesionRepository.js';
import { hoyLocal, limitesDelRango } from './horario.js';

export function getGanancias(deps: {
  estadisticas: IEstadisticasRepository;
  sesiones: ISesionRepository;
}) {
  return async (
    idConductor: number,
    q: { desde?: string; hasta?: string },
  ): Promise<GananciasRango & { desde: string; hasta: string; horasEnLinea: number }> => {
    const hoy = hoyLocal();
    const desde = q.desde ?? hoy;
    const hasta = q.hasta ?? hoy;
    const { desdeTs, hastaTs } = limitesDelRango(desde, hasta);
    const [rango, horasEnLinea] = await Promise.all([
      deps.estadisticas.ganancias(idConductor, desde, hasta),
      deps.sesiones.horasEnLinea(idConductor, desdeTs, hastaTs),
    ]);
    return { desde, hasta, horasEnLinea, ...rango };
  };
}
