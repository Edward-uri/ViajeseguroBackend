import { describe, it, expect, vi } from 'vitest';
import { crearVacante } from './crearVacante.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError } from '../../flotillas/domain/errors.js';

function makeDeps(opts: { vehiculo: { idPropietario: number; idMunicipio: number } | null }) {
  const vehiculos = { findById: vi.fn(async () => opts.vehiculo) };
  const bolsa = { crearVacante: vi.fn(async (a: unknown) => ({ idVacante: 1, estado: 'abierta', ...(a as object) })) };
  return { bolsa, vehiculos } as any;
}

const INPUT = { idPropietario: 1, idVehiculo: 42, condiciones: null };

describe('crearVacante', () => {
  it('dueño del vehículo: crea la vacante derivando idMunicipio del vehículo', async () => {
    const deps = makeDeps({ vehiculo: { idPropietario: 1, idMunicipio: 7 } });

    await crearVacante(deps)(INPUT);

    expect(deps.bolsa.crearVacante).toHaveBeenCalledWith({
      idPropietario: 1, idVehiculo: 42, idMunicipio: 7, condiciones: null,
    });
  });

  it('vehículo de otro propietario: NoEsTuVehiculoError y no llama crearVacante', async () => {
    const deps = makeDeps({ vehiculo: { idPropietario: 99, idMunicipio: 7 } });

    await expect(crearVacante(deps)(INPUT)).rejects.toThrow(NoEsTuVehiculoError);
    expect(deps.bolsa.crearVacante).not.toHaveBeenCalled();
  });

  it('vehículo inexistente: VehiculoNoEncontradoError', async () => {
    const deps = makeDeps({ vehiculo: null });

    await expect(crearVacante(deps)(INPUT)).rejects.toThrow(VehiculoNoEncontradoError);
  });
});
