import { describe, it, expect, vi } from 'vitest';
import { retirarPostulacion } from './retirarPostulacion.js';
import { PostulacionNoEncontradaError, NoEsTuPostulacionError, PostulacionNoPendienteError } from '../domain/errors.js';

function makeDeps(opts: {
  postulacion: { idConductor: number } | null;
  retirarPostulacion?: (...args: unknown[]) => Promise<unknown>;
}) {
  const bolsa = {
    postulacionPorId: vi.fn(async () => opts.postulacion),
    retirarPostulacion: vi.fn(
      opts.retirarPostulacion ?? (async () => ({ idPostulacion: 9, estado: 'retirada' })),
    ),
  };
  return { bolsa } as any;
}

const INPUT = { idPostulacion: 9, idConductor: 3 };

describe('retirarPostulacion', () => {
  it('dueño de la postulación: la retira (marca estado retirada, no DELETE)', async () => {
    const deps = makeDeps({ postulacion: { idConductor: 3 } });

    await retirarPostulacion(deps)(INPUT);

    expect(deps.bolsa.retirarPostulacion).toHaveBeenCalledWith(9);
  });

  it('autorización cruzada: postulación de OTRO conductor → NoEsTuPostulacionError, no retira', async () => {
    const deps = makeDeps({ postulacion: { idConductor: 77 } });

    await expect(retirarPostulacion(deps)(INPUT)).rejects.toThrow(NoEsTuPostulacionError);
    expect(deps.bolsa.retirarPostulacion).not.toHaveBeenCalled();
  });

  it('postulación inexistente: PostulacionNoEncontradaError', async () => {
    const deps = makeDeps({ postulacion: null });

    await expect(retirarPostulacion(deps)(INPUT)).rejects.toThrow(PostulacionNoEncontradaError);
  });

  it('postulación ya no pendiente (p.ej. aceptada): 409 propagado del repo, sin re-intento', async () => {
    const deps = makeDeps({
      postulacion: { idConductor: 3 },
      retirarPostulacion: async () => { throw new PostulacionNoPendienteError(); },
    });

    await expect(retirarPostulacion(deps)(INPUT)).rejects.toThrow(PostulacionNoPendienteError);
    expect(deps.bolsa.retirarPostulacion).toHaveBeenCalledWith(9);
  });
});
