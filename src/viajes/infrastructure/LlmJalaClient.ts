import type { IClasificadorResenas } from '../domain/ports/IClasificadorResenas.js';
import type { EtiquetaCatalogo, RolEtiqueta } from '../domain/repositories/IEtiquetaRepository.js';

/** Cliente HTTP de LLM-JALA. Cualquier fallo lanza: el job deja la evaluación pendiente y reintenta. */
export class LlmJalaClient implements IClasificadorResenas {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string,
    private readonly timeoutMs = 45_000,
  ) {}

  async clasificar(input: {
    comentario: string;
    rolEvaluado: RolEtiqueta;
    calificacion: number;
    candidatas: EtiquetaCatalogo[];
  }): Promise<{ etiquetas: number[] }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    const res = await fetch(`${this.baseUrl}/clasificar`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        comentario: input.comentario,
        rol_evaluado: input.rolEvaluado,
        calificacion: input.calificacion,
        etiquetas_candidatas: input.candidatas.map((c) => ({
          id: c.id,
          texto: c.texto,
          descripcion: c.descripcion,
          polaridad: c.polaridad,
        })),
      }),
    });
    if (!res.ok) throw new Error(`LLM-JALA respondió ${res.status}`);
    const datos = (await res.json()) as { etiquetas?: unknown };
    const etiquetas = Array.isArray(datos.etiquetas)
      ? datos.etiquetas.filter((e): e is number => Number.isInteger(e))
      : [];
    return { etiquetas };
  }
}
