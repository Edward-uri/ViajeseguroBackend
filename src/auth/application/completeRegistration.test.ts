import { describe, it, expect, vi } from 'vitest';
import { completeRegistration } from './completeRegistration.js';
import { emitirTokens } from './sessionTokens.js';
import { signRegistrationToken } from '../../core/jwt.js';

function makeDeps() {
  const created = { idUsuario: 42, toPublicJSON: () => ({ idUsuario: 42 }) };
  return {
    created,
    users: { createUserWithPersona: vi.fn(async () => created) },
    sessions: { crear: vi.fn(async () => ({ idSesion: 1 })), actualizarHash: vi.fn(async () => {}) },
    propietarios: { asegurarExiste: vi.fn(async () => {}) },
  } as any;
}

const base = { nombre: 'Ana', apellidoPaterno: 'Diaz' };

describe('completeRegistration multi-rol', () => {
  it("registro 'conductor' crea {propietario,pasajero} + fila propietarios", async () => {
    const deps = makeDeps();
    const token = signRegistrationToken({ correo: 'a@b.c', rol: 'conductor' });
    await completeRegistration(deps)({ registrationToken: token, ...base });
    const args = deps.users.createUserWithPersona.mock.calls[0][0];
    expect(args.roles.sort()).toEqual(['pasajero', 'propietario']);
    expect(deps.propietarios.asegurarExiste).toHaveBeenCalledWith(42);
  });

  it("registro 'propietario' idem", async () => {
    const deps = makeDeps();
    const token = signRegistrationToken({ correo: 'p@b.c', rol: 'propietario' });
    await completeRegistration(deps)({ registrationToken: token, ...base });
    expect(deps.users.createUserWithPersona.mock.calls[0][0].roles.sort()).toEqual(['pasajero', 'propietario']);
    expect(deps.propietarios.asegurarExiste).toHaveBeenCalled();
  });

  it("registro 'pasajero' NO crea propietario", async () => {
    const deps = makeDeps();
    const token = signRegistrationToken({ correo: 'x@b.c', rol: 'pasajero' });
    await completeRegistration(deps)({ registrationToken: token, ...base });
    const args = deps.users.createUserWithPersona.mock.calls[0][0];
    expect(args.roles).toEqual(['pasajero']);
    expect(deps.propietarios.asegurarExiste).not.toHaveBeenCalled();
  });

  it('emitirTokens loguea error si usuario_roles llega vacío (guard m7)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const sessions = { crear: vi.fn(async () => ({ idSesion: 1 })), actualizarHash: vi.fn(async () => {}) } as any;
    await emitirTokens(sessions, 42, [], null);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('sin filas en usuario_roles'));
    spy.mockRestore();
  });
});
