import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError, ConductorNoEncontradoError } from '../domain/errors.js';

export function asignarConductor(deps: {
  vehiculos: IVehiculoRepository;
  asignaciones: IAsignacionRepository;
}) {
  return async ({ idVehiculo, idPropietario, idConductor }: {
    idVehiculo: number; idPropietario: number; idConductor: number;
  }): Promise<{ ok: true }> => {
    const vehiculo = await deps.vehiculos.findById(idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== idPropietario) throw new NoEsTuVehiculoError();
    if (!(await deps.asignaciones.existeConductor(idConductor))) throw new ConductorNoEncontradoError();
    await deps.asignaciones.asignar({ idVehiculo, idConductor });
    return { ok: true };
  };
}
