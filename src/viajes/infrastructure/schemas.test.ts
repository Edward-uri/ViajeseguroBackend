import { describe, it, expect } from 'vitest';
import { EvaluacionSchema } from './schemas.js';

describe('EvaluacionSchema', () => {
  it('acepta comentario de hasta 160 caracteres', () => {
    expect(EvaluacionSchema.safeParse({ calificacion: 5, comentario: 'a'.repeat(160) }).success).toBe(true);
  });

  it('rechaza comentario de 161 caracteres', () => {
    expect(EvaluacionSchema.safeParse({ calificacion: 5, comentario: 'a'.repeat(161) }).success).toBe(false);
  });
});
