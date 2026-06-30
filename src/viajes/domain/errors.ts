import { NotFoundError, ForbiddenError, ConflictError, ValidationError, AppError } from '../../core/errors.js';

export class ViajeNoEncontradoError extends NotFoundError { constructor() { super('Viaje'); } }
export class NoEsTuViajeError extends ForbiddenError { constructor() { super('No tienes acceso a este viaje'); } }
export class TransicionInvalidaError extends ConflictError {
  constructor(de: string, a: string) { super(`No se puede pasar de ${de} a ${a}`); }
}
export class ViajeNoCompletadoError extends ConflictError { constructor() { super('El viaje no está completado'); } }
export class MunicipioInvalidoError extends ValidationError { constructor() { super('El municipio no existe o no está activo'); } }
export class ZonaInvalidaError extends ValidationError { constructor() { super('La zona no existe en ese municipio'); } }
export class ZonaNoEncontradaError extends NotFoundError { constructor() { super('Zona'); } }
export class MunicipioNoEncontradoError extends NotFoundError { constructor() { super('Municipio'); } }
export class ZonaNombreDuplicadoError extends ConflictError {
  constructor(nombre: string) {
    super(`Ya existe una zona "${nombre}" en este municipio. Si está inactiva, reactívala.`);
  }
}
export class VehiculoNoEncontradoError extends AppError {
  constructor() { super('Vehículo no encontrado', 404, 'VEHICULO_NO_ENCONTRADO'); }
}
export class VehiculoNoAutorizadoError extends AppError {
  constructor() { super('No puedes aceptar viajes con este vehículo', 403, 'VEHICULO_NO_AUTORIZADO'); }
}
export class ConductorOcupadoError extends ConflictError {
  constructor() { super('Ya tienes un viaje activo; termínalo antes de aceptar otro'); }
}
export class PasajeroConViajeActivoError extends ConflictError {
  constructor() { super('Ya tienes un viaje en curso'); }
}
