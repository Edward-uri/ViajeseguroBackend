import { z } from 'zod';

// Set común de motivos; la app muestra el subconjunto según el rol reportado.
export const MOTIVOS_REPORTE = [
  'conduccion_peligrosa',
  'falta_respeto',
  'cobro_indebido',
  'unidad_insegura',
  'comportamiento_inseguro',
  'dano_a_unidad',
  'no_se_presento',
  'otro',
] as const;

export const ReportarSchema = z
  .object({
    idViaje: z.number().int().positive(),
    motivo: z.enum(MOTIVOS_REPORTE),
    comentario: z.string().max(500).optional(),
  })
  .refine(
    (d) => d.motivo !== 'otro' || (d.comentario != null && d.comentario.trim().length > 0),
    { message: 'El comentario es obligatorio cuando el motivo es "otro"', path: ['comentario'] },
  );
