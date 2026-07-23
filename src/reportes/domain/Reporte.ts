export type RolReportado = 'conductor' | 'pasajero';

export interface Reporte {
  idReporte: number;
  idViaje: number | null;
  idReportante: number;
  idReportado: number;
  rolReportado: RolReportado;
  motivo: string;
  comentario: string | null;
  creadoEn: Date | null;
}
