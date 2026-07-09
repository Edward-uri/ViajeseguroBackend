import { describe, it, expect, vi } from 'vitest';
import { activarPropietario } from './activarPropietario.js';

function makeDeps() {
  const users = { addRol: vi.fn(async () => {}) };
  const propietarios = { asegurarExiste: vi.fn(async () => {}) };
  return { users, propietarios } as any;
}

describe('activarPropietario: upgrade pasajero→propietario (idempotente)', () => {
  it('pasajero puro: agrega rol propietario + asegura fila en propietarios', async () => {
    const deps = makeDeps();

    await activarPropietario(deps)({ idUsuario: 5 });

    expect(deps.users.addRol).toHaveBeenCalledWith(5, 'propietario');
    expect(deps.propietarios.asegurarExiste).toHaveBeenCalledWith(5);
  });

  it('ya-propietario: ambos corren igual, sin error (idempotencia delegada al repo)', async () => {
    const deps = makeDeps();

    await expect(activarPropietario(deps)({ idUsuario: 5 })).resolves.toBeUndefined();

    expect(deps.users.addRol).toHaveBeenCalledWith(5, 'propietario');
    expect(deps.propietarios.asegurarExiste).toHaveBeenCalledWith(5);
  });
});
