import { describe, it, expect, vi } from 'vitest';
import { revocarConductor } from './revocarConductor.js';
import { AsignacionEnViajeError } from '../domain/errors.js';

function makeDeps(opts: { viajeActivo: boolean; revocarResult: boolean; activo: number | null }) {
  const vehiculos = {
    findById: vi.fn(async () => ({ idPropietario: 1 })),
  };
  const asignaciones = {
    revocar: vi.fn(async () => opts.revocarResult),
  };
  const viajes = {
    conductorOVehiculoConViajeActivo: vi.fn(async () => opts.viajeActivo),
  };
  const conductores = {
    getVehiculoActivo: vi.fn(async () => opts.activo),
    setVehiculoActivo: vi.fn(async () => {}),
  };
  const push = { enviar: vi.fn(async () => {}) };
  return { vehiculos, asignaciones, viajes, conductores, push } as any;
}

const INPUT = { idVehiculo: 42, idPropietario: 1, idConductor: 7 };

describe('revocarConductor: candado de viaje activo + limpieza de vehículo activo', () => {
  it('viaje activo (conductor o vehículo) → AsignacionEnViajeError y NO llama revocar', async () => {
    const deps = makeDeps({ viajeActivo: true, revocarResult: true, activo: 42 });

    await expect(revocarConductor(deps)(INPUT)).rejects.toThrow(AsignacionEnViajeError);
    expect(deps.asignaciones.revocar).not.toHaveBeenCalled();
  });

  it('sin viaje activo + vehículo activo del conductor == revocado: revoca y limpia activo', async () => {
    const deps = makeDeps({ viajeActivo: false, revocarResult: true, activo: 42 });

    await revocarConductor(deps)(INPUT);

    expect(deps.asignaciones.revocar).toHaveBeenCalledWith({ idVehiculo: 42, idConductor: 7 });
    expect(deps.conductores.setVehiculoActivo).toHaveBeenCalledWith(7, null);
  });

  it('sin viaje activo + activo era OTRO vehículo: revoca y NO limpia', async () => {
    const deps = makeDeps({ viajeActivo: false, revocarResult: true, activo: 99 });

    await revocarConductor(deps)(INPUT);

    expect(deps.asignaciones.revocar).toHaveBeenCalledWith({ idVehiculo: 42, idConductor: 7 });
    expect(deps.conductores.setVehiculoActivo).not.toHaveBeenCalled();
  });
});
