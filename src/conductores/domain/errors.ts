import { NotFoundError, ForbiddenError, ValidationError } from '../../core/errors.js';

export class ConductorNoEncontradoError extends NotFoundError {
  constructor() { super('Conductor'); }
}
export class DocumentoNoEncontradoError extends NotFoundError {
  constructor() { super('Documento'); }
}
export class ArchivoRequeridoError extends ValidationError {
  constructor() { super('Se requiere un archivo válido (jpg, png o pdf, máx. 5 MB)'); }
}
export class NoEsTuDocumentoError extends ForbiddenError {
  constructor() { super('No puedes acceder a este documento'); }
}
