import { describe, it, expect, vi } from 'vitest';
import { postular } from './postular.js';
import { VacanteNoEncontradaError, VacanteCerradaError, NoPuedesPostularATuPropiaVacanteError, YaPostulasteError } from '../domain/errors.js';

function makeDeps(opts: {
  vacante: { idPropietario: number; estado: 'abierta' | 'cerrada' } | null;
  crearPostulacion?: (...args: unknown[]) => Promise<unknown>;
}) {
  const bolsa = {
    vacantePorId: vi.fn(async () => opts.vacante),
    crearPostulacion: vi.fn(
      opts.crearPostulacion ?? (async () => ({ idPostulacion: 1, estado: 'pendiente' })),
    ),
  };
  return { bolsa } as any;
}

const INPUT = { idVacante: 5, idConductor: 3, mensaje: null };

describe('postular', () => {
  it('vacante abierta y ajena: crea la postulación', async () => {
    const deps = makeDeps({ vacante: { idPropietario: 1, estado: 'abierta' } });

    await postular(deps)(INPUT);

    expect(deps.bolsa.crearPostulacion).toHaveBeenCalledWith({ idVacante: 5, idConductor: 3, mensaje: null });
  });

  it('vacante cerrada: VacanteCerradaError, no crea postulación', async () => {
    const deps = makeDeps({ vacante: { idPropietario: 1, estado: 'cerrada' } });

    await expect(postular(deps)(INPUT)).rejects.toThrow(VacanteCerradaError);
    expect(deps.bolsa.crearPostulacion).not.toHaveBeenCalled();
  });

  it('propia vacante (el conductor es el dueño): NoPuedesPostularATuPropiaVacanteError', async () => {
    const deps = makeDeps({ vacante: { idPropietario: 3, estado: 'abierta' } });

    await expect(postular(deps)(INPUT)).rejects.toThrow(NoPuedesPostularATuPropiaVacanteError);
    expect(deps.bolsa.crearPostulacion).not.toHaveBeenCalled();
  });

  it('vacante inexistente: VacanteNoEncontradaError', async () => {
    const deps = makeDeps({ vacante: null });

    await expect(postular(deps)(INPUT)).rejects.toThrow(VacanteNoEncontradaError);
  });

  it('re-postular tras retirada: el repo revive la fila (upsert) → pendiente con mensaje nuevo', async () => {
    const deps = makeDeps({
      vacante: { idPropietario: 1, estado: 'abierta' },
      crearPostulacion: async () => ({ idPostulacion: 1, estado: 'pendiente', mensaje: 'nuevo intento' }),
    });

    const result = await postular(deps)({ ...INPUT, mensaje: 'nuevo intento' });

    expect(result).toEqual({ idPostulacion: 1, estado: 'pendiente', mensaje: 'nuevo intento' });
    expect(deps.bolsa.crearPostulacion).toHaveBeenCalledWith({ idVacante: 5, idConductor: 3, mensaje: 'nuevo intento' });
  });

  it('re-postular con una pendiente existente: 409 YaPostulasteError propagado del repo (upsert no matchea)', async () => {
    const deps = makeDeps({
      vacante: { idPropietario: 1, estado: 'abierta' },
      crearPostulacion: async () => { throw new YaPostulasteError(); },
    });

    await expect(postular(deps)(INPUT)).rejects.toThrow(YaPostulasteError);
  });
});
