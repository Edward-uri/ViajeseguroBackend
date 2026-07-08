import { describe, it, expect, vi } from 'vitest';
import { aceptarPostulacion } from './aceptarPostulacion.js';
import { PostulacionNoPendienteError, NoEsTuVacanteError } from '../domain/errors.js';

const TX_RESULT = {
  postulacion: { idPostulacion: 9, idVacante: 5, idConductor: 3, estado: 'aceptada', mensaje: null },
  vacante: { idVacante: 5, idPropietario: 1, idVehiculo: 20, idMunicipio: 1, condiciones: null, estado: 'cerrada' },
  rechazadosIdsConductor: [7, 8],
};

function makeDeps(opts: {
  aceptarPostulacion?: (...args: unknown[]) => Promise<unknown>;
  vehiculoActivo?: number | null;
  pushFails?: boolean;
} = {}) {
  const orden: string[] = [];
  const bolsa = {
    aceptarPostulacion: vi.fn(
      opts.aceptarPostulacion ?? (async () => { orden.push('tx'); return TX_RESULT; }),
    ),
  };
  const conductores = {
    getVehiculoActivo: vi.fn(async () => { orden.push('getVehiculoActivo'); return opts.vehiculoActivo ?? null; }),
    setVehiculoActivo: vi.fn(async () => { orden.push('setVehiculoActivo'); }),
  };
  const push = {
    enviar: vi.fn(async (args: { idUsuario: number }) => {
      orden.push(`push:${args.idUsuario}`);
      if (opts.pushFails) throw new Error('fcm caído');
    }),
  };
  return { deps: { bolsa, conductores, push } as any, orden };
}

const INPUT = { idPostulacion: 9, idPropietario: 1 };

describe('aceptarPostulacion', () => {
  it('happy path: tx única + orden completo (tx -> vehículo activo -> push aceptado -> push rechazados)', async () => {
    const { deps, orden } = makeDeps({ vehiculoActivo: null });

    const result = await aceptarPostulacion(deps)(INPUT);

    expect(result).toEqual(TX_RESULT);
    // tx única: un solo call a la transacción del repo.
    expect(deps.bolsa.aceptarPostulacion).toHaveBeenCalledTimes(1);
    expect(deps.bolsa.aceptarPostulacion).toHaveBeenCalledWith(INPUT);

    // vehículo activo: como getVehiculoActivo -> null, se setea.
    expect(deps.conductores.getVehiculoActivo).toHaveBeenCalledWith(3);
    expect(deps.conductores.setVehiculoActivo).toHaveBeenCalledWith(3, 20);

    // notificaciones: aceptado + cada rechazado.
    expect(deps.push.enviar).toHaveBeenCalledWith(expect.objectContaining({ idUsuario: 3 }));
    expect(deps.push.enviar).toHaveBeenCalledWith(expect.objectContaining({ idUsuario: 7 }));
    expect(deps.push.enviar).toHaveBeenCalledWith(expect.objectContaining({ idUsuario: 8 }));
    expect(deps.push.enviar).toHaveBeenCalledTimes(3);

    // orden asertado end-to-end.
    expect(orden).toEqual(['tx', 'getVehiculoActivo', 'setVehiculoActivo', 'push:3', 'push:7', 'push:8']);
  });

  it('ya tiene vehículo activo: NO llama setVehiculoActivo (no-fatal, solo si estaba en null)', async () => {
    const { deps } = makeDeps({ vehiculoActivo: 99 });

    await aceptarPostulacion(deps)(INPUT);

    expect(deps.conductores.getVehiculoActivo).toHaveBeenCalledWith(3);
    expect(deps.conductores.setVehiculoActivo).not.toHaveBeenCalled();
  });

  it('postulación no pendiente: 409 propagado desde la tx, nada de post-proceso corre', async () => {
    const { deps } = makeDeps({
      aceptarPostulacion: async () => { throw new PostulacionNoPendienteError(); },
    });

    await expect(aceptarPostulacion(deps)(INPUT)).rejects.toThrow(PostulacionNoPendienteError);
    expect(deps.conductores.getVehiculoActivo).not.toHaveBeenCalled();
    expect(deps.conductores.setVehiculoActivo).not.toHaveBeenCalled();
    expect(deps.push.enviar).not.toHaveBeenCalled();
  });

  it('vacante ajena: 403 propagado desde la tx, nada mutado ni notificado', async () => {
    const { deps } = makeDeps({
      aceptarPostulacion: async () => { throw new NoEsTuVacanteError(); },
    });

    await expect(aceptarPostulacion(deps)(INPUT)).rejects.toThrow(NoEsTuVacanteError);
    expect(deps.push.enviar).not.toHaveBeenCalled();
  });

  it('falla de notificación (push) NO revierte ni lanza: la aceptación ya está persistida', async () => {
    const { deps } = makeDeps({ pushFails: true });

    const result = await aceptarPostulacion(deps)(INPUT);

    expect(result).toEqual(TX_RESULT);
    expect(deps.push.enviar).toHaveBeenCalled();
  });

  it('falla no-fatal de setVehiculoActivo NO revierte ni lanza: sigue a notificaciones', async () => {
    const { deps } = makeDeps({ vehiculoActivo: null });
    deps.conductores.setVehiculoActivo = vi.fn(async () => { throw new Error('db caída'); });

    const result = await aceptarPostulacion(deps)(INPUT);

    expect(result).toEqual(TX_RESULT);
    expect(deps.push.enviar).toHaveBeenCalledTimes(3);
  });
});
