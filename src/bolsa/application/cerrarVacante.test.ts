import { describe, it, expect, vi } from 'vitest';
import { cerrarVacante } from './cerrarVacante.js';
import { VacanteNoEncontradaError, NoEsTuVacanteError } from '../domain/errors.js';

function makeDeps(opts: { vacante: { idPropietario: number } | null }) {
  const bolsa = {
    vacantePorId: vi.fn(async () => opts.vacante),
    cerrarVacante: vi.fn(async () => ({ idVacante: 5, estado: 'cerrada' })),
  };
  return { bolsa } as any;
}

const INPUT = { idVacante: 5, idPropietario: 1 };

describe('cerrarVacante', () => {
  it('dueño de la vacante: la cierra', async () => {
    const deps = makeDeps({ vacante: { idPropietario: 1 } });

    await cerrarVacante(deps)(INPUT);

    expect(deps.bolsa.cerrarVacante).toHaveBeenCalledWith(5);
  });

  it('autorización cruzada: vacante de OTRO propietario → NoEsTuVacanteError, no cierra', async () => {
    const deps = makeDeps({ vacante: { idPropietario: 99 } });

    await expect(cerrarVacante(deps)(INPUT)).rejects.toThrow(NoEsTuVacanteError);
    expect(deps.bolsa.cerrarVacante).not.toHaveBeenCalled();
  });

  it('vacante inexistente: VacanteNoEncontradaError', async () => {
    const deps = makeDeps({ vacante: null });

    await expect(cerrarVacante(deps)(INPUT)).rejects.toThrow(VacanteNoEncontradaError);
  });
});
