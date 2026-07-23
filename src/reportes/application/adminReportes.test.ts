import { describe, it, expect, vi } from 'vitest';
import { vetarConductor } from './vetarConductor.js';
import { reactivarConductor } from './reactivarConductor.js';
import { listarUsuariosReportados } from './listarUsuariosReportados.js';
import { detalleUsuarioReportado } from './detalleUsuarioReportado.js';
import { NotFoundError } from '../../core/errors.js';

describe('vetarConductor', () => {
  it('suspende la cuenta y revoca todas las sesiones del conductor', async () => {
    const users = { suspenderCuenta: vi.fn(async () => {}) };
    const sessions = { revocarTodasDeUsuario: vi.fn(async () => {}) };
    const push = { enviar: vi.fn(async () => {}) };
    await vetarConductor({ users, sessions, push })(7);
    expect(users.suspenderCuenta).toHaveBeenCalledWith(7);
    expect(sessions.revocarTodasDeUsuario).toHaveBeenCalledWith(7);
    expect(push.enviar).toHaveBeenCalled();
  });
});

describe('reactivarConductor', () => {
  it('reactiva la cuenta del conductor', async () => {
    const users = { reactivarCuenta: vi.fn(async () => {}) };
    const push = { enviar: vi.fn(async () => {}) };
    await reactivarConductor({ users, push })(7);
    expect(users.reactivarCuenta).toHaveBeenCalledWith(7);
    expect(push.enviar).toHaveBeenCalled();
  });
});

describe('listarUsuariosReportados', () => {
  it('traduce page/perPage a limit/offset y calcula totalPages', async () => {
    const reportes = {
      listarUsuariosConReportes: vi.fn(async () => ({ data: [], total: 25 })),
    };
    const result = await listarUsuariosReportados({ reportes })(2, 10);
    expect(reportes.listarUsuariosConReportes).toHaveBeenCalledWith({ limit: 10, offset: 10 });
    expect(result).toMatchObject({ page: 2, perPage: 10, total: 25, totalPages: 3 });
  });
});

describe('detalleUsuarioReportado', () => {
  it('lanza NotFound si el usuario no existe', async () => {
    const reportes = { detalleUsuarioReportado: vi.fn(async () => null) };
    await expect(detalleUsuarioReportado({ reportes })(99, 'conductor')).rejects.toThrow(NotFoundError);
  });
});
