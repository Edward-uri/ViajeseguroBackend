import { describe, it, expect, vi } from 'vitest';
import { authMiddleware, requireRole } from './authMiddleware.js';
import { signAccessToken } from '../core/jwt.js';
import { tenantActual } from '../core/tenantContext.js';
import type { Request, Response } from 'express';

function reqWith(user: unknown): Request {
  return { user } as unknown as Request;
}
const res = {} as Response;

describe('requireRole con roles[]', () => {
  it('pasa si algún rol del usuario está permitido', () => {
    const next = vi.fn();
    requireRole('conductor')(reqWith({ sub: 1, roles: ['propietario', 'conductor'] }), res, next);
    expect(next).toHaveBeenCalledWith(); // sin error
  });

  it('rechaza si no hay intersección', () => {
    const next = vi.fn();
    requireRole('admin')(reqWith({ sub: 1, roles: ['propietario', 'pasajero'] }), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error); // ForbiddenError
  });

  it('pasajero puro NO pasa un gate conductor|propietario', () => {
    const next = vi.fn();
    requireRole('conductor', 'propietario')(reqWith({ sub: 1, roles: ['pasajero'] }), res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});

describe('authMiddleware: req.tenant', () => {
  function reqConToken(token: string): Request {
    return { headers: { authorization: `Bearer ${token}` } } as unknown as Request;
  }

  it('expone el idMunicipio del token como req.tenant', () => {
    const req = reqConToken(signAccessToken({ sub: 5, roles: ['pasajero'], idMunicipio: 3 }));
    const next = vi.fn();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.tenant).toBe(3);
  });

  it('admin (idMunicipio null) queda como tenant null = cross-tenant', () => {
    const req = reqConToken(signAccessToken({ sub: 1, roles: ['admin'], idMunicipio: null }));
    const next = vi.fn();
    authMiddleware(req, res, next);
    expect(req.tenant).toBeNull();
  });

  it('token viejo sin claim (rollover) normaliza a null, no undefined', () => {
    // Simula un token emitido antes del deploy del claim.
    const req = reqConToken(signAccessToken({ sub: 2, roles: ['pasajero'], idMunicipio: undefined as unknown as null }));
    const next = vi.fn();
    authMiddleware(req, res, next);
    expect(req.tenant).toBeNull();
  });

  it('publica el TenantContext (ALS) hacia los handlers: tenant y isAdmin', () => {
    const req = reqConToken(signAccessToken({ sub: 5, roles: ['pasajero'], idMunicipio: 3 }));
    let visto: unknown = 'no-corrió';
    authMiddleware(req, res, () => { visto = tenantActual(); });
    expect(visto).toEqual({ tenant: 3, isAdmin: false });

    const reqAdmin = reqConToken(signAccessToken({ sub: 1, roles: ['admin'], idMunicipio: null }));
    authMiddleware(reqAdmin, res, () => { visto = tenantActual(); });
    expect(visto).toEqual({ tenant: null, isAdmin: true });
  });
});
