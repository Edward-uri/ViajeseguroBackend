import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError } from '../domain/errors.js';

export function listarConductoresAsignados(deps: {
  vehiculos: IVehiculoRepository;
  asignaciones: IAsignacionRepository;
}) {
  return async ({ idVehiculo, idPropietario }: {
    idVehiculo: number; idPropietario: number;
  }): Promise<number[]> => {
    const vehiculo = await deps.vehiculos.findById(idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== idPropietario) throw new NoEsTuVehiculoError();
    return deps.asignaciones.listarConductoresPorVehiculo(idVehiculo);
  };
}
