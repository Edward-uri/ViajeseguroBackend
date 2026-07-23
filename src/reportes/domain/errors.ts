import { ForbiddenError, ConflictError } from '../../core/errors.js';

export class NoEsTuViajeError extends ForbiddenError {
  constructor() {
    super('No participaste en este viaje');
  }
}

export class ViajeNoReportableError extends ConflictError {
  constructor() {
    super('Solo puedes reportar viajes con conductor asignado');
  }
}

export class YaReportadoError extends ConflictError {
  constructor() {
    super('Ya reportaste a esta persona; ya está bloqueada');
  }
}
