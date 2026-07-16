export type TipoEvaluacion = 'pasajero_a_conductor' | 'conductor_a_pasajero';
export type RolEtiqueta = 'conductor' | 'pasajero';
export type PolaridadEtiqueta = 'positiva' | 'negativa';

export interface EtiquetaCatalogo {
  id: number;
  texto: string;
  descripcion: string;
  polaridad: PolaridadEtiqueta;
}

export interface EvaluacionPendienteNlp {
  idEvaluacion: number;
  tipo: TipoEvaluacion;
  calificacion: number;
  comentario: string | null;
}

export interface EtiquetaAgregada {
  id: number;
  texto: string;
  polaridad: PolaridadEtiqueta;
  conteo: number;
}

export interface IEtiquetaRepository {
  catalogoActivo(rol: RolEtiqueta): Promise<EtiquetaCatalogo[]>;
  pendientesNlp(limite: number): Promise<EvaluacionPendienteNlp[]>;
  /** Inserta las etiquetas y marca nlp_procesado_en, en una sola transacción. */
  marcarProcesada(idEvaluacion: number, idsEtiquetas: number[]): Promise<void>;
  /** Top de etiquetas del usuario en un rol, sobre la ventana de evaluaciones más recientes. */
  topDeUsuario(idUsuario: number, rol: RolEtiqueta): Promise<EtiquetaAgregada[]>;
}
