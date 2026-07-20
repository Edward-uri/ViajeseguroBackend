import { describe, it, expect, vi } from 'vitest';
import { crearMunicipio } from './crearMunicipio.js';
import { Municipio } from '../domain/Municipio.js';
import type { IMunicipioRepository } from '../domain/repositories/IMunicipioRepository.js';
import type { IPerimetroProvider } from '../domain/IPerimetroProvider.js';

const POLIGONO = { type: 'Polygon' as const, coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] };

function deps(perimetro: 'ok' | 'null' | 'falla') {
  const municipios = {
    crear: vi.fn(async () => new Municipio(7, 'Villaflores', 'Chiapas', true)),
    guardarPerimetro: vi.fn(async () => {}),
  } as unknown as IMunicipioRepository;
  const perimetros = {
    obtener: vi.fn(async () => {
      if (perimetro === 'falla') throw new Error('OSM caído');
      return perimetro === 'ok' ? POLIGONO : null;
    }),
  } as unknown as IPerimetroProvider;
  return { municipios, perimetros };
}

describe('crearMunicipio', () => {
  it('crea y carga el perímetro de OSM en el mismo paso', async () => {
    const d = deps('ok');
    const r = await crearMunicipio(d)({ nombre: 'Villaflores', estado: 'Chiapas' });
    expect(r.perimetroCargado).toBe(true);
    expect(d.municipios.guardarPerimetro).toHaveBeenCalledWith(7, POLIGONO);
    expect(r.municipio.idMunicipio).toBe(7);
  });

  it('OSM sin polígono: crea igual, perimetroCargado=false', async () => {
    const r = await crearMunicipio(deps('null'))({ nombre: 'X', estado: 'Chiapas' });
    expect(r.perimetroCargado).toBe(false);
  });

  it('OSM caído: el alta NO falla (perímetro se carga después con el script)', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = await crearMunicipio(deps('falla'))({ nombre: 'X', estado: 'Chiapas' });
    expect(r.perimetroCargado).toBe(false);
    spy.mockRestore();
  });
});
