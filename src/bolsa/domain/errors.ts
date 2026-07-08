import { NotFoundError, ForbiddenError, AppError } from '../../core/errors.js';

export class VacanteNoEncontradaError extends NotFoundError {
  constructor() { super('Vacante'); }
}
export class PostulacionNoEncontradaError extends NotFoundError {
  constructor() { super('Postulación'); }
}
export class NoEsTuVacanteError extends ForbiddenError {
  constructor() { super('No puedes acceder a esta vacante'); }
}
export class NoEsTuPostulacionError extends ForbiddenError {
  constructor() { super('No puedes acceder a esta postulación'); }
}
export class NoPuedesPostularATuPropiaVacanteError extends ForbiddenError {
  constructor() { super('No puedes postular a tu propia vacante'); }
}
export class VacanteYaAbiertaError extends AppError {
  constructor() { super('Ya tienes una vacante abierta para este vehículo', 409, 'VACANTE_YA_ABIERTA'); }
}
export class VacanteCerradaError extends AppError {
  constructor() { super('Esta vacante ya está cerrada', 409, 'VACANTE_CERRADA'); }
}
export class YaPostulasteError extends AppError {
  constructor() { super('Ya postulaste a esta vacante', 409, 'YA_POSTULASTE'); }
}
export class PostulacionNoPendienteError extends AppError {
  constructor() { super('Esta postulación ya no está pendiente', 409, 'POSTULACION_NO_PENDIENTE'); }
}
