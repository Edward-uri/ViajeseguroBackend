export type EstadoVacante = 'abierta' | 'cerrada';
export type TipoTurno = 'completo' | 'matutino' | 'vespertino' | 'nocturno';

export interface Vacante {
  idVacante: number;
  idPropietario: number;
  idVehiculo: number;
  idMunicipio: number;
  tipoTurno: TipoTurno;
  rentaTurno: number;
  dias: string[];
  horario: string | null;
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
