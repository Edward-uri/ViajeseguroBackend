import { z } from 'zod';

const correo = z.string().email().max(60);
const telefono = z.string().min(10).max(15);
const codigo = z.string().regex(/^\d{4}$/, 'El código debe tener 4 dígitos');

export const RegisterStartSchema = z.object({
  correo,
  rol: z.enum(['pasajero', 'conductor', 'propietario']).optional(),
});

export const RegisterVerifySchema = z.object({
  correo,
  codigo,
  rol: z.enum(['pasajero', 'conductor', 'propietario']).optional(),
});

export const RegisterCompleteSchema = z.object({
  registrationToken: z.string(),
  nombre: z.string().min(1).max(30),
  apellidoPaterno: z.string().min(1).max(30),
  apellidoMaterno: z.string().max(30).optional(),
  telefono: telefono.optional(),
  idSexo: z.number().int().optional(),
  fechaNacimiento: z.string().optional(),
  idMunicipio: z.number().int().positive().optional(),
  dispositivo: z.string().optional(),
});

export const LoginStartSchema = z.object({ correo });
export const LoginVerifySchema = z.object({
  correo,
  codigo,
  dispositivo: z.string().optional(),
});
export const RefreshSchema = z.object({ refreshToken: z.string() });
export const LogoutSchema = z.object({ refreshToken: z.string() });
