import { describe, it, expect, vi } from 'vitest';
import { vetarConductor } from './vetarConductor.js';
import { listarConductoresReportados } from './listarConductoresReportados.js';
import { detalleConductorReportado } from './detalleConductorReportado.js';
import { NotFoundError } from '../../core/errors.js';

describe('vetarConductor', () => {
  it('suspende la cuenta y revoca todas las sesiones del conductor', async () => {
    const users = { suspenderCuenta: vi.fn(async () => {}) };
    const sessions = { revocarTodasDeUsuario: vi.fn(async () => {}) };
    await vetarConductor({ users, sessions })(7);
    expect(users.suspenderCuenta).toHaveBeenCalledWith(7);
    expect(sessions.revocarTodasDeUsuario).toHaveBeenCalledWith(7);
  });
});

describe('listarConductoresReportados', () => {
  it('traduce page/perPage a limit/offset y calcula totalPages', async () => {
    const reportes = {
      listarConductoresConReportes: vi.fn(async () => ({ data: [], total: 25 })),
    };
    const result = await listarConductoresReportados({ reportes })(2, 10);
    expect(reportes.listarConductoresConReportes).toHaveBeenCalledWith({ limit: 10, offset: 10 });
    expect(result).toMatchObject({ page: 2, perPage: 10, total: 25, totalPages: 3 });
  });
});

describe('detalleConductorReportado', () => {
  it('lanza NotFound si el conductor no existe', async () => {
    const reportes = { detalleConductorReportado: vi.fn(async () => null) };
    await expect(detalleConductorReportado({ reportes })(99)).rejects.toThrow(NotFoundError);
  });
});
