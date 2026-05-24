import { ConflictError, NotFoundError, UnauthorizedError } from '../../core/errors.js';

export class UserAlreadyExistsError extends ConflictError {
  public readonly field: string;
  constructor(field: string) {
    super(`Ya existe un usuario con ese ${field}`);
    this.field = field;
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Usuario');
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Credenciales invalidas');
  }
}

export class AccountNotActiveError extends UnauthorizedError {
  constructor() {
    super('La cuenta no esta activa');
  }
}
