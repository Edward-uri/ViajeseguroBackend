import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError } from '../domain/errors.js';

export function revocarConductor(deps: {
  vehiculos: IVehiculoRepository;
  asignaciones: IAsignacionRepository;
}) {
  return async ({ idVehiculo, idPropietario, idConductor }: {
    idVehiculo: number; idPropietario: number; idConductor: number;
  }): Promise<void> => {
    const vehiculo = await deps.vehiculos.findById(idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== idPropietario) throw new NoEsTuVehiculoError();
    await deps.asignaciones.revocar({ idVehiculo, idConductor }); // idempotente: 204 aunque no hubiera activa
  };
}
