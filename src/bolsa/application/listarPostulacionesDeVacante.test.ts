import { describe, it, expect, vi } from 'vitest';
import { listarPostulacionesDeVacante } from './listarPostulacionesDeVacante.js';
import { VacanteNoEncontradaError, NoEsTuVacanteError } from '../domain/errors.js';

function makeDeps(opts: { vacante: { idPropietario: number } | null }) {
  const bolsa = {
    vacantePorId: vi.fn(async () => opts.vacante),
    listarPostulacionesDeVacante: vi.fn(async () => [
      { idPostulacion: 1, conductor: { nombre: 'Juan Pérez', calificacion: 4.8, fotoUrl: null } },
    ]),
  };
  return { bolsa } as any;
}

const INPUT = { idVacante: 5, idPropietario: 1 };

describe('listarPostulacionesDeVacante', () => {
  it('dueño de la vacante: devuelve postulaciones con shape público del conductor', async () => {
    const deps = makeDeps({ vacante: { idPropietario: 1 } });

    const result = await listarPostulacionesDeVacante(deps)(INPUT);

    expect(deps.bolsa.listarPostulacionesDeVacante).toHaveBeenCalledWith(5);
    expect(result[0].conductor).toEqual({ nombre: 'Juan Pérez', calificacion: 4.8, fotoUrl: null });
  });

  it('autorización cruzada: vacante de OTRO propietario → NoEsTuVacanteError, no lista', async () => {
    const deps = makeDeps({ vacante: { idPropietario: 99 } });

    await expect(listarPostulacionesDeVacante(deps)(INPUT)).rejects.toThrow(NoEsTuVacanteError);
    expect(deps.bolsa.listarPostulacionesDeVacante).not.toHaveBeenCalled();
  });

  it('vacante inexistente: VacanteNoEncontradaError', async () => {
    const deps = makeDeps({ vacante: null });

    await expect(listarPostulacionesDeVacante(deps)(INPUT)).rejects.toThrow(VacanteNoEncontradaError);
  });
});
