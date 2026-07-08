import { z } from 'zod';
import { MAX_PASAJEROS } from '../domain/tipos.js';

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
  personas: z.number().int().min(1).max(MAX_PASAJEROS).default(1),
  tarifaEstimada: z.number().finite().positive().optional(),
});

export const CancelarViajeSchema = z.object({ motivo: z.string().max(255).optional() });

export const AceptarViajeSchema = z.object({
  idVehiculo: z
    .number()
    .int()
    .positive()
    .describe('Si se omite, se usa el vehículo activo del conductor')
    .optional(),
});

export const EvaluacionSchema = z.object({
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional(),
});

export const DispositivoSchema = z.object({
  tokenFcm: z.string().min(1).max(255),
  plataforma: z.enum(['android', 'ios']),
});

export const IdParamSchema = z.coerce.number().int().positive();

export const RutaQuerySchema = z.object({
  fromLat: z.coerce.number().min(-90).max(90),
  fromLng: z.coerce.number().min(-180).max(180),
  toLat: z.coerce.number().min(-90).max(90),
  toLng: z.coerce.number().min(-180).max(180),
});

const precioZona = z.number().finite().positive().max(999999.99);
const latZona = z.number().finite().min(-90).max(90);
const lngZona = z.number().finite().min(-180).max(180);

export const CrearZonaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120),
    precio: precioZona,
    lat: latZona.optional(),
    lng: lngZona.optional(),
  })
  .refine((v) => (v.lat == null) === (v.lng == null), {
    message: 'lat y lng deben venir juntos o ninguno',
  });

export const ActualizarZonaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(120).optional(),
    precio: precioZona.optional(),
    lat: latZona.optional(),
    lng: lngZona.optional(),
    activo: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada que actualizar' })
  .refine((v) => (v.lat == null) === (v.lng == null), {
    message: 'lat y lng deben venir juntos o ninguno',
  });
