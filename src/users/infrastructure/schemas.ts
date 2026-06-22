import { z } from 'zod';

const telefono = z.string().min(10).max(15);

export const EditarPerfilSchema = z
  .object({
    nombre: z.string().min(1).max(30).optional(),
    apellidoPaterno: z.string().min(1).max(30).optional(),
    apellidoMaterno: z.string().max(30).nullable().optional(),
    idSexo: z.number().int().positive().optional(),
    fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').optional(),
    telefono: telefono.optional(),
  })
  .refine((b) => Object.keys(b).length > 0, { message: 'Debe enviar al menos un campo' });

export type EditarPerfilInput = z.infer<typeof EditarPerfilSchema>;
