import { describe, it, expect } from 'vitest';
import { EvaluacionSchema, EventoDemandaSchema } from './schemas.js';

describe('EvaluacionSchema', () => {
  it('acepta comentario de hasta 160 caracteres', () => {
    expect(EvaluacionSchema.safeParse({ calificacion: 5, comentario: 'a'.repeat(160) }).success).toBe(true);
  });

  it('rechaza comentario de 161 caracteres', () => {
    expect(EvaluacionSchema.safeParse({ calificacion: 5, comentario: 'a'.repeat(161) }).success).toBe(false);
  });
});

describe('EventoDemandaSchema', () => {
  it('acepta coordenadas dentro de Chiapas', () => {
    expect(EventoDemandaSchema.safeParse({ tipo: 'apertura_solicitud', lat: 16.75, lng: -93.1 }).success).toBe(true);
  });

  it('rechaza lat fuera del rango de Chiapas', () => {
    expect(EventoDemandaSchema.safeParse({ tipo: 'cotizacion', lat: 25, lng: -93.1 }).success).toBe(false);
  });
});
