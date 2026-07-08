import { describe, it, expect, vi } from 'vitest';
import { aceptarViaje } from './aceptarViaje.js';
import { SinVehiculoActivoError } from '../domain/errors.js';

function makeViaje(estado = 'solicitado') {
  return {
    estado,
    data: { idMunicipio: 1 },
    idPasajero: 5,
    toJSON: () => ({ idViaje: 1, estado: 'aceptado' }),
  };
}

function makeDeps(opts?: { activo?: number | null }) {
  const viaje = makeViaje();
  const viajes = {
    porId: vi.fn(async () => viaje),
    conductorConViajeActivo: vi.fn(async () => false),
    cambiarEstado: vi.fn(async () => viaje),
  };
  const notifier = {
    viajeAceptado: vi.fn(async () => {}),
    viajeYaNoDisponible: vi.fn(async () => {}),
  };
  const push = { enviar: vi.fn(async () => {}) };
  const autorizacion = {
    existeVehiculo: vi.fn(async () => true),
    conductorAutorizado: vi.fn(async () => true),
    vehiculoAprobado: vi.fn(async () => true),
  };
  const conductores = {
    getVehiculoActivo: vi.fn(async () => (opts?.activo === undefined ? null : opts.activo)),
  };
  const municipioDelConductor = vi.fn(async () => 1);
  return { viajes, notifier, push, autorizacion, conductores, municipioDelConductor } as any;
}

describe('aceptarViaje deriva el vehiculo activo cuando falta idVehiculo', () => {
  it('CON idVehiculo: no llama getVehiculoActivo y valida con el id recibido (byte-compat)', async () => {
    const deps = makeDeps();

    await aceptarViaje(deps)(1, 10, 7);

    expect(deps.conductores.getVehiculoActivo).not.toHaveBeenCalled();
    expect(deps.autorizacion.existeVehiculo).toHaveBeenCalledWith(7);
    expect(deps.autorizacion.conductorAutorizado).toHaveBeenCalledWith(10, 7);
    expect(deps.autorizacion.vehiculoAprobado).toHaveBeenCalledWith(7);
    expect(deps.viajes.cambiarEstado).toHaveBeenCalledWith(
      expect.objectContaining({ idVehiculo: 7 }),
    );
  });

  it('SIN idVehiculo + activo=7: usa el activo y valida igual', async () => {
    const deps = makeDeps({ activo: 7 });

    await aceptarViaje(deps)(1, 10, undefined);

    expect(deps.conductores.getVehiculoActivo).toHaveBeenCalledWith(10);
    expect(deps.autorizacion.existeVehiculo).toHaveBeenCalledWith(7);
    expect(deps.autorizacion.conductorAutorizado).toHaveBeenCalledWith(10, 7);
    expect(deps.autorizacion.vehiculoAprobado).toHaveBeenCalledWith(7);
    expect(deps.viajes.cambiarEstado).toHaveBeenCalledWith(
      expect.objectContaining({ idVehiculo: 7 }),
    );
  });

  it('SIN idVehiculo + activo NULL: lanza SinVehiculoActivoError y nada mas se llama', async () => {
    const deps = makeDeps({ activo: null });

    await expect(aceptarViaje(deps)(1, 10, undefined)).rejects.toBeInstanceOf(SinVehiculoActivoError);

    expect(deps.viajes.porId).not.toHaveBeenCalled();
    expect(deps.autorizacion.existeVehiculo).not.toHaveBeenCalled();
    expect(deps.autorizacion.conductorAutorizado).not.toHaveBeenCalled();
    expect(deps.autorizacion.vehiculoAprobado).not.toHaveBeenCalled();
    expect(deps.viajes.cambiarEstado).not.toHaveBeenCalled();
  });
});
