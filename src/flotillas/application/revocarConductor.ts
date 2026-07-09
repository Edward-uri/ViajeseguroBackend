import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import type { IViajeRepository } from '../../viajes/domain/repositories/IViajeRepository.js';
import type { IConductorRepository } from '../../conductores/domain/repositories/IConductorRepository.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError, AsignacionEnViajeError } from '../domain/errors.js';

export function revocarConductor(deps: {
  vehiculos: IVehiculoRepository;
  asignaciones: IAsignacionRepository;
  viajes: IViajeRepository;
  conductores: IConductorRepository;
}) {
  return async ({ idVehiculo, idPropietario, idConductor }: {
    idVehiculo: number; idPropietario: number; idConductor: number;
  }): Promise<void> => {
    const vehiculo = await deps.vehiculos.findById(idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== idPropietario) throw new NoEsTuVehiculoError();

    // Regla del dueño: no se puede revocar mientras hay un viaje en curso (conductor o vehículo).
    if (await deps.viajes.conductorOVehiculoConViajeActivo(idConductor, idVehiculo)) {
      throw new AsignacionEnViajeError();
    }

    const revocado = await deps.asignaciones.revocar({ idVehiculo, idConductor }); // idempotente: 204 aunque no hubiera activa

    if (revocado) {
      // Limpieza no-fatal: si el vehículo revocado era el activo del conductor, se libera.
      try {
        if ((await deps.conductores.getVehiculoActivo(idConductor)) === idVehiculo) {
          await deps.conductores.setVehiculoActivo(idConductor, null);
        }
      } catch (err) {
        console.error('[revocarConductor] limpieza de vehículo activo falló:', err);
      }
    }
  };
}
