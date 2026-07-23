export type TipoTurno = 'completo' | 'matutino' | 'vespertino' | 'nocturno';

/** Conductor con asignación activa a un vehículo del dueño, con su PII pública
 *  (nombre/foto/calificación, sin teléfono) y los términos de la relación. */
export interface ConductorAsignado {
  idConductor: number;
  nombre: string | null;
  fotoUrl: string | null;
  calificacion: number | null;
  origen: 'propia' | 'bolsa';
  tipoTurno: TipoTurno | null;
  rentaTurno: number | null;
  dias: string[];
  horario: string | null;
}
