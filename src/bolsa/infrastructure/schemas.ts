import { z } from 'zod';

export const CrearVacanteSchema = z.object({
  idVehiculo: z.number().int().positive(),
  condiciones: z.string().max(1000).optional(),
});

export const PostularSchema = z.object({
  mensaje: z.string().max(1000).optional(),
});

export const ListarVacantesQuerySchema = z.object({
  municipio: z.coerce.number().int().positive(),
});
