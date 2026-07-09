import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import type { IConductorRepository } from '../../conductores/domain/repositories/IConductorRepository.js';
import { NoEsTuVehiculoError } from '../domain/errors.js';

export function setVehiculoActivoUseCase(deps: {
  asignaciones: IAsignacionRepository;
  conductores: Pick<IConductorRepository, 'setVehiculoActivo'>;
}) {
  return async ({ idConductor, idVehiculo }: { idConductor: number; idVehiculo: number }): Promise<{ ok: true }> => {
    if (!(await deps.asignaciones.conductorAutorizado(idConductor, idVehiculo))) throw new NoEsTuVehiculoError();
    await deps.conductores.setVehiculoActivo(idConductor, idVehiculo);
    return { ok: true };
  };
}
