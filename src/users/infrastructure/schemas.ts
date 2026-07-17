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

export const CrearDireccionSchema = z.object({
  etiqueta: z.string().trim().min(1).max(40).optional(),
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  texto: z.string().trim().min(1).max(255).optional(),
  esFavorita: z.boolean().optional(),
});
