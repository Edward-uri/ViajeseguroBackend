import { describe, it, expect } from 'vitest';
import { validarViajeEnMunicipio } from './validarViajeEnMunicipio.js';
import { ViajeFueraDelMunicipioError } from '../domain/errors.js';
import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';

const SUCHIAPA = { lat: 16.6294, lng: -93.0917 };
const TUXTLA = { lat: 16.7531, lng: -93.1156 }; // ~14 km del centro de Suchiapa

function zonasCon(distancias: Map<string, number>) {
  return {
    zonaMasCercana: async (_m: number, c: { lat: number; lng: number }) => {
      const d = distancias.get(`${c.lat},${c.lng}`);
      return d == null ? null : { idZona: 1, precio: 12, distanciaKm: d };
    },
  } as unknown as IZonaTarifaRepository;
}

const sinPerimetro = { perimetroDe: async () => null } as unknown as IMunicipioRepository;
// Cuadradito alrededor de Suchiapa pueblo (~±0.02°)
const conPerimetro = {
  perimetroDe: async () => ({
    type: 'Polygon' as const,
    coordinates: [[[-93.12, 16.61], [-93.07, 16.61], [-93.07, 16.65], [-93.12, 16.65], [-93.12, 16.61]]],
  }),
} as unknown as IMunicipioRepository;

describe('validarViajeEnMunicipio', () => {
  it('con perímetro: dentro pasa, afueras cercanas se rechazan (precisión)', async () => {
    const v = validarViajeEnMunicipio({ zonas: zonasCon(new Map()), municipios: conPerimetro, radioKm: 7 });
    await expect(v(1, SUCHIAPA, { lat: 16.64, lng: -93.09 })).resolves.toBeUndefined();
    // A ~3 km del pueblo pero FUERA del polígono: el radio lo dejaba pasar, el polígono no.
    await expect(v(1, SUCHIAPA, { lat: 16.66, lng: -93.09 })).rejects.toBeInstanceOf(ViajeFueraDelMunicipioError);
    await expect(v(1, SUCHIAPA, TUXTLA)).rejects.toBeInstanceOf(ViajeFueraDelMunicipioError);
  });

  it('acepta viaje con origen y destino dentro del radio', async () => {
    const zonas = zonasCon(new Map([[`${SUCHIAPA.lat},${SUCHIAPA.lng}`, 0.5], ['16.63,-93.09', 1.2]]));
    await expect(
      validarViajeEnMunicipio({ zonas, municipios: sinPerimetro, radioKm: 7 })(1, SUCHIAPA, { lat: 16.63, lng: -93.09 }),
    ).resolves.toBeUndefined();
  });

  it('rechaza destino fuera del municipio (Suchiapa → Tuxtla)', async () => {
    const zonas = zonasCon(new Map([[`${SUCHIAPA.lat},${SUCHIAPA.lng}`, 0.5], [`${TUXTLA.lat},${TUXTLA.lng}`, 14]]));
    await expect(
      validarViajeEnMunicipio({ zonas, municipios: sinPerimetro, radioKm: 7 })(1, SUCHIAPA, TUXTLA),
    ).rejects.toBeInstanceOf(ViajeFueraDelMunicipioError);
  });

  it('rechaza origen fuera del municipio', async () => {
    const zonas = zonasCon(new Map([[`${TUXTLA.lat},${TUXTLA.lng}`, 14], [`${SUCHIAPA.lat},${SUCHIAPA.lng}`, 0.5]]));
    await expect(
      validarViajeEnMunicipio({ zonas, municipios: sinPerimetro, radioKm: 7 })(1, TUXTLA, SUCHIAPA),
    ).rejects.toBeInstanceOf(ViajeFueraDelMunicipioError);
  });

  it('sin zonas con centroide: deja pasar (no hay perímetro contra qué validar)', async () => {
    const zonas = zonasCon(new Map());
    await expect(
      validarViajeEnMunicipio({ zonas, municipios: sinPerimetro, radioKm: 7 })(1, SUCHIAPA, TUXTLA),
    ).resolves.toBeUndefined();
  });
});
