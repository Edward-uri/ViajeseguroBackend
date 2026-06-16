import { z } from 'zod';

const telefono = z.string().min(10).max(15);
const codigo = z.string().regex(/^\d{4}$/, 'El código debe tener 4 dígitos');

export const RegisterStartSchema = z.object({
  telefono,
  rol: z.enum(['pasajero', 'conductor']).optional(),
});

export const RegisterVerifySchema = z.object({
  telefono,
  codigo,
  rol: z.enum(['pasajero', 'conductor']).optional(),
});

export const RegisterCompleteSchema = z.object({
  registrationToken: z.string(),
  nombre: z.string().min(1).max(30),
  apellidoPaterno: z.string().min(1).max(30),
  apellidoMaterno: z.string().max(30).optional(),
  correo: z.string().email().max(60).optional(),
  idSexo: z.number().int().optional(),
  fechaNacimiento: z.string().optional(),
  idMunicipio: z.number().int().positive().optional(),
  dispositivo: z.string().optional(),
});

export const LoginStartSchema = z.object({ identificador: z.string().min(5) });
export const LoginVerifySchema = z.object({
  identificador: z.string().min(5),
  codigo,
  dispositivo: z.string().optional(),
});
export const RefreshSchema = z.object({ refreshToken: z.string() });
export const LogoutSchema = z.object({ refreshToken: z.string() });
