import type { Reporte, RolReportado } from '../Reporte.js';

/** Fila de la lista admin: un usuario reportado en un rol, con su acumulado. */
export interface UsuarioReportado {
  idUsuario: number;
  rol: RolReportado;
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

/** Detalle admin: contacto del usuario + sus reportes en ese rol. */
export interface DetalleUsuarioReportado {
  idUsuario: number;
  rol: RolReportado;
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

  /** Usuarios con reportes (cualquier rol), ordenados por conteo desc. Paginado.
   *  Un usuario reportado en dos roles aparece como dos filas distintas. */
  listarUsuariosConReportes(args: { limit: number; offset: number }): Promise<{
    data: UsuarioReportado[];
    total: number;
  }>;

  /** Detalle de un usuario reportado en un rol (contacto + reportes de ese rol). null si no existe. */
  detalleUsuarioReportado(idUsuario: number, rol: RolReportado): Promise<DetalleUsuarioReportado | null>;
}
