import { describe, it, expect } from 'vitest';
import { rolPrincipal, signAccessToken, verifyAccessToken } from './jwt.js';

describe('rolPrincipal', () => {
  it('prioriza admin > propietario > conductor > pasajero', () => {
    expect(rolPrincipal(['pasajero', 'propietario'])).toBe('propietario');
    expect(rolPrincipal(['conductor', 'admin'])).toBe('admin');
    expect(rolPrincipal(['pasajero'])).toBe('pasajero');
    expect(rolPrincipal([])).toBe('pasajero'); // fallback defensivo
  });
});

describe('access token con roles[]', () => {
  it('firma y verifica sub y roles, sin rol en el payload', () => {
    const token = signAccessToken({ sub: 7, roles: ['propietario', 'pasajero'], idMunicipio: 3 });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe(7);
    expect(payload.roles).toEqual(['propietario', 'pasajero']);
    expect(payload).not.toHaveProperty('rol');
  });

  it('lleva idMunicipio como claim de tenant (y null para admins)', () => {
    const conMunicipio = verifyAccessToken(signAccessToken({ sub: 7, roles: ['pasajero'], idMunicipio: 3 }));
    expect(conMunicipio.idMunicipio).toBe(3);
    const admin = verifyAccessToken(signAccessToken({ sub: 1, roles: ['admin'], idMunicipio: null }));
    expect(admin.idMunicipio).toBeNull();
  });
});
