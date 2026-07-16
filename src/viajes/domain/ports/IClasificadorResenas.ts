import type { EtiquetaCatalogo, RolEtiqueta } from '../repositories/IEtiquetaRepository.js';

/** Servicio NLP (LLM-JALA) que infiere etiquetas del catálogo a partir del comentario. */
export interface IClasificadorResenas {
  clasificar(input: {
    comentario: string;
    rolEvaluado: RolEtiqueta;
    calificacion: number;
    candidatas: EtiquetaCatalogo[];
  }): Promise<{ etiquetas: number[] }>;
}
