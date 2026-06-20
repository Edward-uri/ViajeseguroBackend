export interface Disponibilidad {
  idConductor: number;
  disponible: boolean;
  lat: number | null;
  lng: number | null;
  actualizadoEn: Date | null;
}
