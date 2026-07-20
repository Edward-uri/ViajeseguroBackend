import { describe, it, expect } from 'vitest';
import { puntoEnPerimetro, type PerimetroGeoJSON } from './geo.js';

// Cuadrado 1x1 con hueco 0.4-0.6 (GeoJSON: [lng, lat])
const cuadrado: PerimetroGeoJSON = {
  type: 'Polygon',
  coordinates: [
    [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
    [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6], [0.4, 0.4]],
  ],
};

describe('puntoEnPerimetro', () => {
  it('dentro del polígono', () => {
    expect(puntoEnPerimetro({ lat: 0.2, lng: 0.2 }, cuadrado)).toBe(true);
  });
  it('fuera del polígono', () => {
    expect(puntoEnPerimetro({ lat: 1.5, lng: 0.5 }, cuadrado)).toBe(false);
  });
  it('dentro de un hueco cuenta como fuera', () => {
    expect(puntoEnPerimetro({ lat: 0.5, lng: 0.5 }, cuadrado)).toBe(false);
  });
  it('MultiPolygon: dentro de cualquiera de los polígonos', () => {
    const multi: PerimetroGeoJSON = {
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
        [[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]],
      ],
    };
    expect(puntoEnPerimetro({ lat: 5.5, lng: 5.5 }, multi)).toBe(true);
    expect(puntoEnPerimetro({ lat: 3, lng: 3 }, multi)).toBe(false);
  });
});
