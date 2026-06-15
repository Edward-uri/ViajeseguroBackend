import type { IOtpRepository } from '../domain/repositories/IOtpRepository.js';
import { verificarCodigo, MAX_INTENTOS } from '../domain/otp.js';
import { signRegistrationToken, type Rol } from '../../core/jwt.js';
import { OtpInvalidoError } from '../domain/errors.js';

const ROLES_PERMITIDOS: Rol[] = ['pasajero', 'conductor'];

export function verifyRegistration(deps: { otp: IOtpRepository }) {
  return async ({ telefono, codigo, rol }: { telefono: string; codigo: string; rol?: Rol }): Promise<{ registrationToken: string }> => {
    const row = await deps.otp.ultimoVigente(telefono, 'registro');
    if (!row || row.intentos >= MAX_INTENTOS) throw new OtpInvalidoError();
    if (!(await verificarCodigo(codigo, row.codigoHash))) {
      await deps.otp.incrementarIntentos(row.idCodigo);
      throw new OtpInvalidoError();
    }
    await deps.otp.marcarUsado(row.idCodigo);
    const rolFinal: Rol = rol && ROLES_PERMITIDOS.includes(rol) ? rol : 'pasajero';
    return { registrationToken: signRegistrationToken({ telefono, rol: rolFinal }) };
  };
}
