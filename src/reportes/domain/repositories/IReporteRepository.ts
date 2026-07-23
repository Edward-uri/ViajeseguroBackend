import type { Reporte, RolReportado } from '../Reporte.js';

/** Fila de la lista admin: un conductor con su acumulado de reportes. */
export interface ConductorReportado {
  idConductor: number;
  nombre: string | null;
  conteo: number;
  ultimoReporte: Date | null;
  estadoCuenta: string;
}

/** Un reporte visto desde el detalle admin del conductor (con nombre del reportante). */
export interface ReporteConReportante {
  idReporte: number;
  idViaje: number | null;
  idReportante: number;
  reportanteNombre: string | null;
  motivo: string;
  comentario: string | null;
  creadoEn: Date | null;
}

/** Detalle admin: contacto del conductor + sus reportes. */
export interface DetalleConductorReportado {
  idConductor: number;
  nombre: string | null;
  telefono: string | null;
  correo: string | null;
  estadoCuenta: string;
  conteo: number;
  reportes: ReporteConReportante[];
}

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

  // ───── Admin ─────

  /** Conductores con reportes, ordenados por conteo desc. Paginado. */
  listarConductoresConReportes(args: { limit: number; offset: number }): Promise<{
    data: ConductorReportado[];
    total: number;
  }>;

  /** Detalle de un conductor reportado (contacto + sus reportes). null si no existe el usuario. */
  detalleConductorReportado(idConductor: number): Promise<DetalleConductorReportado | null>;
}
