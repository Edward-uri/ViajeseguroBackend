import { z } from 'zod';

const correo = z.string().email().max(60);
const telefono = z.string().min(10).max(15);
const codigo = z.string().regex(/^\d{4}$/, 'El código debe tener 4 dígitos');

export const passwordPolitica = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número');

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
  password: passwordPolitica.optional(),
});

export const LoginStartSchema = z.object({ correo });
export const LoginVerifySchema = z.object({
  correo,
  codigo,
  dispositivo: z.string().optional(),
});
export const RefreshSchema = z.object({ refreshToken: z.string() });
export const LogoutSchema = z.object({ refreshToken: z.string() });

export const SetPasswordSchema = z.object({ password: passwordPolitica });

export const LoginPasswordSchema = z.object({
  correo,
  password: z.string().min(1),
  dispositivo: z.string().optional(),
});

export const CrearInvitacionSchema = z.object({ correo });
export const AceptarInvitacionSchema = z.object({
  token: z.string().min(1),
  password: passwordPolitica,
  dispositivo: z.string().optional(),
});
