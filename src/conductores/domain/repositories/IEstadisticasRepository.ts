export interface StatsHoy {
  viajesHoy: number;
  gananciasHoy: number;
  viajesTotal: number;
  calificacionPromedio: number | null;
}

export interface GananciaViaje {
  idViaje: number;
  fechaFin: string;        // ISO de fecha_fin
  tarifa: number;
  origenTexto: string | null;
  destinoTexto: string | null;
}

export interface GananciasRango {
  totalGanancias: number;
  totalViajes: number;
  viajes: GananciaViaje[];
}

export interface IEstadisticasRepository {
  statsHoy(idConductor: number): Promise<StatsHoy>;
  /** desde/hasta = YYYY-MM-DD locales (America/Mexico_City), inclusivos. */
  ganancias(idConductor: number, desde: string, hasta: string): Promise<GananciasRango>;
}
