import type { Reporte, RolReportado } from '../Reporte.js';

export interface IReporteRepository {
  crear(args: {
    idViaje: number | null;
    idReportante: number;
    idReportado: number;
    rolReportado: RolReportado;
    motivo: string;
    comentario: string | null;
  }): Promise<Reporte>;

  /** ¿Existe un reporte entre A y B en cualquier dirección? (= par bloqueado). */
  estanBloqueados(idA: number, idB: number): Promise<boolean>;

  /** Ids de todos los usuarios bloqueados con [idUsuario] (la otra parte de cada reporte). */
  usuariosBloqueadosCon(idUsuario: number): Promise<number[]>;

  /** Cuántos reportes tiene un conductor (rol_reportado='conductor'). Para el veto. */
  contarReportesDeConductor(idConductor: number): Promise<number>;
}
