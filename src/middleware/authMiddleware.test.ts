import { describe, it, expect, vi } from 'vitest';
import { requireRole } from './authMiddleware.js';
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
