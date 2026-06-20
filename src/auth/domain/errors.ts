import { ConflictError, UnauthorizedError, ForbiddenError } from '../../core/errors.js';

export class OtpInvalidoError extends UnauthorizedError {
  constructor() { super('Código inválido o expirado'); }
}
export class TelefonoYaRegistradoError extends ConflictError {
  constructor() { super('El teléfono ya está registrado'); }
}
export class CorreoYaRegistradoError extends ConflictError {
  constructor() { super('El correo ya está registrado'); }
}
export class CredencialesError extends UnauthorizedError {
  constructor() { super('No existe una cuenta con ese identificador'); }
}
export class RolNoPermitidoError extends ForbiddenError {
  constructor() { super('Rol no permitido en registro'); }
}
