import type { EstadoVacante } from './Vacante.js';

export type EstadoPostulacion = 'pendiente' | 'aceptada' | 'rechazada' | 'retirada';

export interface Postulacion {
  idPostulacion: number;
  idVacante: number;
  idConductor: number;
  estado: EstadoPostulacion;
  mensaje: string | null;
}

export interface PostulacionConConductor extends Postulacion {
  conductor: { nombre: string | null; calificacion: number | null; fotoUrl: string | null };
}

export interface PostulacionConVacante extends Postulacion {
  idVehiculo: number;
  idMunicipio: number;
  estadoVacante: EstadoVacante;
}
