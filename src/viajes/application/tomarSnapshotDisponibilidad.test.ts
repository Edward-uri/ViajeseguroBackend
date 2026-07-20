import { describe, it, expect, vi } from 'vitest';
import { tomarSnapshotDisponibilidad } from './tomarSnapshotDisponibilidad.js';

describe('tomarSnapshotDisponibilidad', () => {
  it('llama al repo y devuelve el conteo de filas copiadas', async () => {
    const senales = { copiarDisponibilidadActual: vi.fn(async () => 5) } as any;

    const n = await tomarSnapshotDisponibilidad({ senales })();

    expect(senales.copiarDisponibilidadActual).toHaveBeenCalledOnce();
    expect(n).toBe(5);
  });
});
