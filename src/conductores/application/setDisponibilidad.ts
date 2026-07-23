import type { IDisponibilidadRepository } from '../domain/repositories/IDisponibilidadRepository.js';
import type { ISesionRepository } from '../domain/repositories/ISesionRepository.js';
import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { Disponibilidad } from '../domain/Disponibilidad.js';
import { CuentaSuspendidaError } from '../../auth/domain/errors.js';

export function setDisponibilidad(deps: {
  disponibilidad: IDisponibilidadRepository;
  sesiones: ISesionRepository;
  usuarios: Pick<IUserRepository, 'findById'>;
}) {
  return async (
    idConductor: number,
    args: { disponible: boolean; lat?: number; lng?: number },
  ): Promise<Disponibilidad> => {
    // Un conductor vetado (cuenta suspendida) no puede ponerse en línea.
    if (args.disponible) {
      const user = await deps.usuarios.findById(idConductor);
      if (user?.estadoCuenta === 'suspendido') throw new CuentaSuspendidaError();
    }
    const d = await deps.disponibilidad.upsert({
      idConductor,
      disponible: args.disponible,
      lat: args.lat ?? null,
      lng: args.lng ?? null,
    });
    if (args.disponible) await deps.sesiones.abrir(idConductor);
    else await deps.sesiones.cerrar(idConductor);
    return d;
  };
}
