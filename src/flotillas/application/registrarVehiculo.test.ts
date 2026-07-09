import { describe, it, expect, vi } from 'vitest';
import { registrarVehiculo } from './registrarVehiculo.js';

function makeDeps(opts: { conductorExiste: boolean; activo: number | null }) {
  const propietarios = { asegurarExiste: vi.fn(async () => {}) };
  const vehiculos = {
    crear: vi.fn(async () => ({ toJSON: () => ({ idVehiculo: 42 }) })),
  };
  const municipios = { existeActivo: vi.fn(async () => true) };
  const conductores = {
    findById: vi.fn(async () => (opts.conductorExiste ? { idConductor: 1 } : null)),
    getVehiculoActivo: vi.fn(async () => opts.activo),
    setVehiculoActivo: vi.fn(async () => {}),
  };
  return { propietarios, vehiculos, municipios, conductores } as any;
}

const INPUT = {
  idPropietario: 1,
  placa: 'ABC-123',
  modelo: null,
  color: null,
  anio: null,
  idMunicipio: 1,
};

describe('registrarVehiculo autoasigna vehiculo activo al conductor creador', () => {
  it('creador ES conductor con activo NULL: setVehiculoActivo(idConductor, idVehiculoNuevo)', async () => {
    const deps = makeDeps({ conductorExiste: true, activo: null });

    await registrarVehiculo(deps)(INPUT);

    expect(deps.conductores.setVehiculoActivo).toHaveBeenCalledWith(1, 42);
  });

  it('creador NO es conductor (sin fila): NO llama setVehiculoActivo', async () => {
    const deps = makeDeps({ conductorExiste: false, activo: null });

    await registrarVehiculo(deps)(INPUT);

    expect(deps.conductores.setVehiculoActivo).not.toHaveBeenCalled();
  });

  it('conductor con activo ya seteado: NO llama setVehiculoActivo', async () => {
    const deps = makeDeps({ conductorExiste: true, activo: 7 });

    await registrarVehiculo(deps)(INPUT);

    expect(deps.conductores.setVehiculoActivo).not.toHaveBeenCalled();
  });
});
