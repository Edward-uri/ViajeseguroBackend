import { z } from 'zod';

const coord = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  texto: z.string().max(255).optional(),
});

export const CrearViajeSchema = z.object({
  idMunicipio: z.number().int().positive(),
  origen: coord,
  destino: coord,
  idZonaDestino: z.number().int().positive().optional(),
});

export const CancelarViajeSchema = z.object({ motivo: z.string().max(255).optional() });

export const AceptarViajeSchema = z.object({ idVehiculo: z.number().int().positive() });

export const EvaluacionSchema = z.object({
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional(),
});

export const DispositivoSchema = z.object({
  tokenFcm: z.string().min(1).max(255),
  plataforma: z.enum(['android', 'ios']),
});
