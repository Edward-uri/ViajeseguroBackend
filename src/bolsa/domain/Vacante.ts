export type EstadoVacante = 'abierta' | 'cerrada';

export interface Vacante {
  idVacante: number;
  idPropietario: number;
  idVehiculo: number;
  idMunicipio: number;
  condiciones: string | null;
  estado: EstadoVacante;
}

export interface VacanteConVehiculo extends Vacante {
  placa: string;
  modelo: string | null;
  color: string | null;
  anio: number | null;
}

export interface VacanteConPendientes extends Vacante {
  postulacionesPendientes: number;
}
