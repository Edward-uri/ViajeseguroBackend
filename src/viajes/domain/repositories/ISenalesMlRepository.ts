export interface EventoDemandaRegistro {
  idUsuario: number;
  tipo: 'apertura_solicitud' | 'cotizacion';
  lat: number;
  lng: number;
  idMunicipio: number | null;
  nConductoresDisponibles: number;
}

/** Señales para el modelo ML de zonas calientes: oferta (snapshots) y demanda (eventos). */
export interface ISenalesMlRepository {
  /** Copia conductor_disponibilidad al historial. Devuelve el número de filas copiadas. */
  copiarDisponibilidadActual(): Promise<number>;
  /** ¿El usuario registró un evento del mismo tipo dentro de los últimos `segundos`? */
  huboEventoReciente(idUsuario: number, tipo: string, segundos: number): Promise<boolean>;
  /** Conductores disponibles ahora; filtrado por municipio del conductor si viene idMunicipio. */
  contarConductoresDisponibles(idMunicipio: number | null): Promise<number>;
  registrarEvento(evento: EventoDemandaRegistro): Promise<void>;
}
