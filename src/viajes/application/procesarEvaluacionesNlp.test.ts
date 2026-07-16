import { describe, it, expect, vi } from 'vitest';
import { procesarEvaluacionesNlp } from './procesarEvaluacionesNlp.js';

function makeDeps(pendientes: unknown[], opts?: { clasificarFalla?: boolean }) {
  const etiquetas = {
    pendientesNlp: vi.fn(async () => pendientes),
    catalogoActivo: vi.fn(async () => [
      { id: 1, texto: 'Buen manejo', descripcion: 'conduce bien', polaridad: 'positiva' },
    ]),
    marcarProcesada: vi.fn(async () => {}),
    topDeUsuario: vi.fn(async () => []),
  };
  const clasificador = {
    clasificar: vi.fn(async () => {
      if (opts?.clasificarFalla) throw new Error('LLM-JALA respondió 503');
      return { etiquetas: [1] };
    }),
  };
  return { etiquetas, clasificador } as any;
}

describe('procesarEvaluacionesNlp', () => {
  it('comentario NULL o vacío: marca procesada sin llamar al clasificador', async () => {
    const deps = makeDeps([
      { idEvaluacion: 7, tipo: 'pasajero_a_conductor', calificacion: 5, comentario: null },
      { idEvaluacion: 8, tipo: 'pasajero_a_conductor', calificacion: 4, comentario: '   ' },
    ]);

    const procesadas = await procesarEvaluacionesNlp(deps)();

    expect(procesadas).toBe(2);
    expect(deps.clasificador.clasificar).not.toHaveBeenCalled();
    expect(deps.etiquetas.marcarProcesada).toHaveBeenCalledWith(7, []);
    expect(deps.etiquetas.marcarProcesada).toHaveBeenCalledWith(8, []);
  });

  it('con comentario: clasifica con el rol del evaluado y persiste las etiquetas', async () => {
    const deps = makeDeps([
      { idEvaluacion: 9, tipo: 'pasajero_a_conductor', calificacion: 5, comentario: 'maneja muy bien' },
      { idEvaluacion: 10, tipo: 'conductor_a_pasajero', calificacion: 5, comentario: 'muy amable' },
    ]);

    await procesarEvaluacionesNlp(deps)();

    expect(deps.clasificador.clasificar).toHaveBeenCalledWith(
      expect.objectContaining({ rolEvaluado: 'conductor', calificacion: 5 }),
    );
    expect(deps.clasificador.clasificar).toHaveBeenCalledWith(
      expect.objectContaining({ rolEvaluado: 'pasajero' }),
    );
    expect(deps.etiquetas.marcarProcesada).toHaveBeenCalledWith(9, [1]);
  });

  it('si el clasificador falla, NO marca la evaluación (queda para reintento) y sigue con las demás', async () => {
    const deps = makeDeps(
      [{ idEvaluacion: 11, tipo: 'pasajero_a_conductor', calificacion: 5, comentario: 'buen viaje' }],
      { clasificarFalla: true },
    );

    const procesadas = await procesarEvaluacionesNlp(deps)();

    expect(procesadas).toBe(0);
    expect(deps.etiquetas.marcarProcesada).not.toHaveBeenCalled();
  });
});
