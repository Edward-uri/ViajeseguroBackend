import { describe, it, expect } from 'vitest';
import { TarifaPorZona } from './TarifaPorZona.js';
import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';

// Centro ($12) en 16.6255,-93.1011 · Santa Fe ($25) en 16.625,-93.0875
const CENTRO = { lat: 16.6255, lng: -93.1011 };
const SANTA_FE = { lat: 16.625, lng: -93.0875 };

const zonas = {
  zonaMasCercana: async (_m: number, c: { lat: number; lng: number }) =>
    Math.abs(c.lng - CENTRO.lng) < Math.abs(c.lng - SANTA_FE.lng)
      ? { idZona: 1, precio: 12, distanciaKm: 0.3 }
      : { idZona: 3, precio: 25, distanciaKm: 0.3 },
  tarifaDeZona: async () => ({ idMunicipio: 1, precio: 20 }),
  tarifaDefault: async () => 15,
} as unknown as IZonaTarifaRepository;

const sinZonas = {
  zonaMasCercana: async () => null,
  tarifaDeZona: async () => null,
  tarifaDefault: async () => 15,
} as unknown as IZonaTarifaRepository;

describe('TarifaPorZona (zona más cara entre origen y destino)', () => {
  it('Centro → Santa Fe cobra la del destino ($25)', async () => {
    const t = await new TarifaPorZona(zonas).calcular({ idMunicipio: 1, personas: 1, origen: CENTRO, destino: SANTA_FE });
    expect(t.tarifaPorPersona).toBe(25);
    expect(t.estimada).toBe(false);
  });

  it('Santa Fe → Centro cobra lo MISMO ($25, simétrica — antes cobraba $12)', async () => {
    const t = await new TarifaPorZona(zonas).calcular({ idMunicipio: 1, personas: 2, origen: SANTA_FE, destino: CENTRO });
    expect(t.tarifaPorPersona).toBe(25);
    expect(t.tarifa).toBe(50);
    expect(t.idZonaDestino).toBe(1); // la zona del destino se reporta igual
  });

  it('sin zonas resueltas cae al default del municipio (estimada)', async () => {
    const t = await new TarifaPorZona(sinZonas).calcular({ idMunicipio: 1, personas: 1, origen: CENTRO, destino: SANTA_FE });
    expect(t.tarifaPorPersona).toBe(15);
    expect(t.estimada).toBe(true);
  });
});
