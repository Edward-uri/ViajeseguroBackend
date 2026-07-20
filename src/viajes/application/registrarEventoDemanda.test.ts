import { describe, it, expect, vi } from 'vitest';
import { registrarEventoDemanda } from './registrarEventoDemanda.js';

function makeSenales(opts?: { reciente?: boolean; disponibles?: number }) {
  return {
    huboEventoReciente: vi.fn(async () => opts?.reciente ?? false),
    contarConductoresDisponibles: vi.fn(async () => opts?.disponibles ?? 0),
    registrarEvento: vi.fn(async () => {}),
  } as any;
}

const base = { idUsuario: 5, tipo: 'apertura_solicitud' as const, lat: 16.75, lng: -93.1 };

describe('registrarEventoDemanda', () => {
  it('anti-spam de 60s: no inserta si hubo un evento reciente del mismo tipo', async () => {
    const senales = makeSenales({ reciente: true });

    await registrarEventoDemanda({ senales })({ ...base, idMunicipio: 1 });

    expect(senales.huboEventoReciente).toHaveBeenCalledWith(5, 'apertura_solicitud', 60);
    expect(senales.contarConductoresDisponibles).not.toHaveBeenCalled();
    expect(senales.registrarEvento).not.toHaveBeenCalled();
  });

  it('sin idMunicipio también funciona: cuenta con null y registra', async () => {
    const senales = makeSenales({ disponibles: 2 });

    await registrarEventoDemanda({ senales })(base);

    expect(senales.contarConductoresDisponibles).toHaveBeenCalledWith(null);
    expect(senales.registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ idMunicipio: null, nConductoresDisponibles: 2 }),
    );
  });

  it('calcula n_conductores_disponibles y lo persiste en el evento', async () => {
    const senales = makeSenales({ disponibles: 3 });

    await registrarEventoDemanda({ senales })({ ...base, idMunicipio: 7 });

    expect(senales.contarConductoresDisponibles).toHaveBeenCalledWith(7);
    expect(senales.registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ idMunicipio: 7, nConductoresDisponibles: 3 }),
    );
  });
});
