import { z } from 'zod';

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado YYYY-MM-DD');

export const LicenciaSchema = z.object({
  idMunicipio: z.number().int().positive(),
  licencia: z.string().min(3).max(50),
  licenciaFechaExpedicion: fecha,
  licenciaFechaVencimiento: fecha,
});

export const TipoDocumentoSchema = z.enum([
  'licencia',
  'ine_frente',
  'ine_reverso',
  'tarjeta_circulacion',
  'foto_vehiculo',
]);

export const RevisarDocumentoSchema = z.discriminatedUnion('estado', [
  z.object({ estado: z.literal('aprobado') }),
  z.object({ estado: z.literal('rechazado'), motivoRechazo: z.string().min(3).max(500) }),
]);

export const DisponibilidadSchema = z.object({
  disponible: z.boolean(),
  lat: z.number().finite().min(-90).max(90).optional(),
  lng: z.number().finite().min(-180).max(180).optional(),
});
