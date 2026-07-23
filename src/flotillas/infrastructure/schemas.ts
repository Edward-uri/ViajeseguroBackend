import { z } from 'zod';

export const PerfilSchema = z.object({
  rfc: z.string().max(20).optional(),
  razonSocial: z.string().max(100).optional(),
});

export const VehiculoSchema = z.object({
  placa: z.string().min(3).max(20),
  modelo: z.string().max(100).optional(),
  color: z.string().max(30).optional(),
  anio: z.number().int().min(1950).max(2100).optional(),
  idMunicipio: z.number().int().positive(),
});

export const EditarVehiculoSchema = z.object({
  modelo: z.string().max(100).optional(),
  color: z.string().max(30).optional(),
  anio: z.number().int().min(1950).max(2100).optional(),
  idMunicipio: z.number().int().positive().optional(),
});

export const RevisarDocumentoVehiculoSchema = z.discriminatedUnion('estado', [
  z.object({ estado: z.literal('aprobado') }),
  z.object({ estado: z.literal('rechazado'), motivoRechazo: z.string().min(3).max(500) }),
]);

export const AsignarConductorSchema = z.object({ idConductor: z.number().int().positive() });

export const SetVehiculoActivoSchema = z.object({ idVehiculo: z.number().int().positive() });

const DIAS_SEMANA = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const;

// Términos que el dueño edita de un conductor ya asignado (mismo shape que la vacante).
export const EditarTerminosConductorSchema = z.object({
  tipoTurno: z.enum(['completo', 'matutino', 'vespertino', 'nocturno']),
  rentaTurno: z.number().positive(),
  dias: z.array(z.enum(DIAS_SEMANA)).min(1),
  horario: z.string().max(50).optional(),
});
