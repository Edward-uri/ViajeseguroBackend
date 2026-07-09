import { describe, it, expect, vi } from 'vitest';
import { reviewDocumento } from './reviewDocumento.js';

function makeDoc(idDocumento: number, idConductor: number, estado = 'pendiente') {
  return { idDocumento, idConductor, tipo: 'licencia', estado };
}

function makeDeps(docsPorConductor: { tipo: string; estado: string }[], opts?: { activo?: number | null; vehiculosPropios?: { idVehiculo: number }[] }) {
  const conductores = {
    registrarCambioEstatus: vi.fn(async () => {}),
    getVehiculoActivo: vi.fn(async () => (opts?.activo === undefined ? null : opts.activo)),
    setVehiculoActivo: vi.fn(async () => {}),
  };
  const documentos = {
    findById: vi.fn(async (id: number) => makeDoc(id, 1)),
    revisar: vi.fn(async () => ({ toJSON: () => ({ idDocumento: 1 }) })),
    listarPorConductor: vi.fn(async () => docsPorConductor),
  };
  const push = { enviar: vi.fn(async () => {}) };
  const users = { addRol: vi.fn(async () => {}) };
  const vehiculos = { listarPorPropietario: vi.fn(async () => opts?.vehiculosPropios ?? []) };
  return { conductores, documentos, push, users, vehiculos } as any;
}

const TODOS_APROBADOS = [
  { tipo: 'licencia', estado: 'aprobado' },
  { tipo: 'ine_frente', estado: 'aprobado' },
  { tipo: 'ine_reverso', estado: 'aprobado' },
];

const UNO_PENDIENTE = [
  { tipo: 'licencia', estado: 'aprobado' },
  { tipo: 'ine_frente', estado: 'pendiente' },
  { tipo: 'ine_reverso', estado: 'aprobado' },
];

describe('reviewDocumento otorga rol conductor', () => {
  it('todos los docs aprobados: addRol(conductor) antes de registrarCambioEstatus', async () => {
    const deps = makeDeps(TODOS_APROBADOS);
    const orden: string[] = [];
    deps.users.addRol.mockImplementation(async () => {
      orden.push('addRol');
    });
    deps.conductores.registrarCambioEstatus.mockImplementation(async () => {
      orden.push('registrarCambioEstatus');
    });

    await reviewDocumento(deps)({
      idDocumento: 1,
      estado: 'aprobado',
      motivoRechazo: null,
      adminId: 9,
    });

    expect(deps.users.addRol).toHaveBeenCalledWith(1, 'conductor');
    expect(deps.conductores.registrarCambioEstatus).toHaveBeenCalled();
    expect(orden).toEqual(['addRol', 'registrarCambioEstatus']);
  });

  it('un doc pendiente: NO otorga rol conductor', async () => {
    const deps = makeDeps(UNO_PENDIENTE);

    await reviewDocumento(deps)({
      idDocumento: 1,
      estado: 'aprobado',
      motivoRechazo: null,
      adminId: 9,
    });

    expect(deps.users.addRol).not.toHaveBeenCalled();
    expect(deps.conductores.registrarCambioEstatus).not.toHaveBeenCalled();
  });
});

describe('reviewDocumento autoasigna primer vehiculo propio', () => {
  it('todos aprobados + tiene vehiculos propios + activo NULL: setVehiculoActivo con el MENOR idVehiculo', async () => {
    const deps = makeDeps(TODOS_APROBADOS, {
      activo: null,
      vehiculosPropios: [{ idVehiculo: 9 }, { idVehiculo: 4 }],
    });

    await reviewDocumento(deps)({
      idDocumento: 1,
      estado: 'aprobado',
      motivoRechazo: null,
      adminId: 9,
    });

    expect(deps.conductores.setVehiculoActivo).toHaveBeenCalledWith(1, 4);
  });

  it('todos aprobados + sin vehiculos propios: NO llama setVehiculoActivo y no falla', async () => {
    const deps = makeDeps(TODOS_APROBADOS, { activo: null, vehiculosPropios: [] });

    await expect(
      reviewDocumento(deps)({
        idDocumento: 1,
        estado: 'aprobado',
        motivoRechazo: null,
        adminId: 9,
      }),
    ).resolves.toBeDefined();

    expect(deps.conductores.setVehiculoActivo).not.toHaveBeenCalled();
  });
});
