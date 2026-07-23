import { describe, it, expect, vi } from 'vitest';
import { setVehiculoActivoUseCase } from './setVehiculoActivoUseCase.js';
import { listarVehiculos } from './listarVehiculos.js';
import { NoEsTuVehiculoError } from '../domain/errors.js';

function makeDeps(opts: { autorizado: boolean }) {
  const asignaciones = { conductorAutorizado: vi.fn(async () => opts.autorizado) };
  const conductores = { setVehiculoActivo: vi.fn(async () => {}) };
  return { asignaciones, conductores } as any;
}

const INPUT = { idConductor: 1, idVehiculo: 9 };

describe('setVehiculoActivoUseCase', () => {
  it('conductor autorizado (dueño o asignado): setea el vehiculo activo', async () => {
    const deps = makeDeps({ autorizado: true });

    const result = await setVehiculoActivoUseCase(deps)(INPUT);

    expect(deps.asignaciones.conductorAutorizado).toHaveBeenCalledWith(1, 9);
    expect(deps.conductores.setVehiculoActivo).toHaveBeenCalledWith(1, 9);
    expect(result).toEqual({ ok: true });
  });

  it('conductor NO autorizado: lanza NoEsTuVehiculoError y NO setea', async () => {
    const deps = makeDeps({ autorizado: false });

    await expect(setVehiculoActivoUseCase(deps)(INPUT)).rejects.toBeInstanceOf(NoEsTuVehiculoError);

    expect(deps.conductores.setVehiculoActivo).not.toHaveBeenCalled();
  });
});

describe('listarVehiculos marca activo comparando contra getVehiculoActivo (una sola llamada)', () => {
  it('flaguea activo:true en el vehiculo activo y activo:false en los demas', async () => {
    const vehiculos = {
      listarPorPropietario: vi.fn(async () => [
        { idVehiculo: 4, placa: 'AAA-111', modelo: null, color: null, anio: null, idMunicipio: 1 },
        { idVehiculo: 9, placa: 'BBB-222', modelo: null, color: null, anio: null, idMunicipio: 1 },
      ]),
      findById: vi.fn(async () => null),
    };
    const documentos = { listarPorVehiculo: vi.fn(async () => []) };
    const asignaciones = {
      vehiculosAsignados: vi.fn(async () => []),
      contarActivosPorVehiculos: vi.fn(async () => ({})),
    };
    const conductores = { getVehiculoActivo: vi.fn(async () => 4) };

    const result = await listarVehiculos({ vehiculos, documentos, asignaciones, conductores } as any)({ idPropietario: 1 });

    expect(conductores.getVehiculoActivo).toHaveBeenCalledTimes(1);
    expect(result.find((v) => v.idVehiculo === 4)?.activo).toBe(true);
    expect(result.find((v) => v.idVehiculo === 9)?.activo).toBe(false);
  });
});
