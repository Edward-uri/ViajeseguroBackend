import { AppError, ConflictError, UnauthorizedError, ForbiddenError } from '../../core/errors.js';

export class OtpInvalidoError extends UnauthorizedError {
  constructor() { super('Código inválido o expirado'); }
}
export class TelefonoYaRegistradoError extends ConflictError {
  constructor() { super('El teléfono ya está registrado'); }
}
export class CorreoYaRegistradoError extends AppError {
  constructor() { super('El correo ya está registrado', 409, 'CORREO_YA_REGISTRADO'); }
}
export class CredencialesError extends AppError {
  constructor() { super('Correo o contraseña inválidos', 401, 'CREDENCIALES'); }
}
export class RolNoPermitidoError extends ForbiddenError {
  constructor() { super('Rol no permitido en registro'); }
}
export class InvitacionInvalidaError extends AppError {
  constructor() { super('Invitación inválida, vencida o revocada', 400, 'INVITACION_INVALIDA'); }
}
export class InvitacionYaAceptadaError extends AppError {
  constructor() { super('La invitación ya fue aceptada', 409, 'INVITACION_YA_ACEPTADA'); }
}
export class InvitacionNoEncontradaError extends AppError {
  constructor() { super('Invitación no encontrada', 404, 'NOT_FOUND'); }
}
