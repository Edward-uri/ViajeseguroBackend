import { z } from 'zod';

export const DIAS_SEMANA = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'] as const;

// Atributos de la oferta de renta (compartidos por crear y editar vacante).
const atributosVacante = {
  tipoTurno: z.enum(['completo', 'matutino', 'vespertino', 'nocturno']),
  rentaTurno: z.number().positive(),
  dias: z.array(z.enum(DIAS_SEMANA)).min(1),
  horario: z.string().max(50).optional(),
  condiciones: z.string().max(1000).optional(),
};

export const CrearVacanteSchema = z.object({
  idVehiculo: z.number().int().positive(),
  ...atributosVacante,
});

export const EditarVacanteSchema = z.object(atributosVacante);

export const PostularSchema = z.object({
  mensaje: z.string().max(1000).optional(),
});

export const ListarVacantesQuerySchema = z.object({
  municipio: z.coerce.number().int().positive(),
});
