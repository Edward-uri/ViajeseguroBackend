import { NotFoundError, ForbiddenError, ValidationError, AppError } from '../../core/errors.js';

export class ConductorNoEncontradoError extends NotFoundError {
  constructor() { super('Conductor'); }
}

export class VehiculoNoEncontradoError extends NotFoundError {
  constructor() { super('Vehículo'); }
}
export class DocumentoNoEncontradoError extends NotFoundError {
  constructor() { super('Documento'); }
}
export class NoEsTuVehiculoError extends ForbiddenError {
  constructor() { super('No puedes acceder a este vehículo'); }
}
export class ArchivoRequeridoError extends ValidationError {
  constructor() { super('Se requiere un archivo válido (jpg, png o pdf, máx. 5 MB)'); }
}
export class MunicipioNoValidoError extends ValidationError {
  constructor() { super('El municipio indicado no existe o no está activo'); }
}
export class PlacaYaRegistradaError extends AppError {
  constructor() { super('Esta placa ya está registrada. Intenta con otra.', 409, 'PLACA_YA_REGISTRADA'); }
}
export class AsignacionEnViajeError extends AppError {
  constructor() { super('No puedes revocar mientras hay un viaje en curso; espera a que termine', 409, 'ASIGNACION_EN_VIAJE'); }
}
export class AsignacionNoEncontradaError extends NotFoundError {
  constructor() { super('Asignación'); }
}
