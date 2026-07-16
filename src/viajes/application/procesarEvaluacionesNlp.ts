import type { IEtiquetaRepository } from '../domain/repositories/IEtiquetaRepository.js';
import type { IClasificadorResenas } from '../domain/ports/IClasificadorResenas.js';

const LOTE_POR_CORRIDA = 20;

/**
 * Job: clasifica con LLM-JALA las evaluaciones sin procesar y persiste sus etiquetas.
 * Un fallo del clasificador deja la evaluación pendiente; la siguiente corrida es el reintento.
 */
export function procesarEvaluacionesNlp(deps: {
  etiquetas: IEtiquetaRepository;
  clasificador: IClasificadorResenas;
}) {
  return async (): Promise<number> => {
    const pendientes = await deps.etiquetas.pendientesNlp(LOTE_POR_CORRIDA);
    let procesadas = 0;
    for (const ev of pendientes) {
      const comentario = ev.comentario?.trim() ?? '';
      if (!comentario) {
        await deps.etiquetas.marcarProcesada(ev.idEvaluacion, []);
        procesadas++;
        continue;
      }
      const rol = ev.tipo === 'pasajero_a_conductor' ? 'conductor' : 'pasajero';
      try {
        const candidatas = await deps.etiquetas.catalogoActivo(rol);
        const { etiquetas } = await deps.clasificador.clasificar({
          comentario,
          rolEvaluado: rol,
          calificacion: ev.calificacion,
          candidatas,
        });
        await deps.etiquetas.marcarProcesada(ev.idEvaluacion, etiquetas);
        procesadas++;
      } catch (e) {
        console.warn(`[nlp] evaluación ${ev.idEvaluacion} queda pendiente (se reintenta):`, e);
      }
    }
    return procesadas;
  };
}
