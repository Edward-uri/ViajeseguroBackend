import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import type { TipoTurno } from '../domain/ConductorAsignado.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError, AsignacionNoEncontradaError } from '../domain/errors.js';

/** El dueño ajusta los términos (turno/renta/días/horario) de un conductor ya asignado a su vehículo. */
export function editarTerminosConductor(deps: {
  vehiculos: IVehiculoRepository;
  asignaciones: IAsignacionRepository;
}) {
  return async (input: {
    idVehiculo: number; idPropietario: number; idConductor: number;
    tipoTurno: TipoTurno; rentaTurno: number; dias: string[]; horario: string | null;
  }): Promise<void> => {
    const vehiculo = await deps.vehiculos.findById(input.idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== input.idPropietario) throw new NoEsTuVehiculoError();

    const ok = await deps.asignaciones.actualizarTerminos({
      idVehiculo: input.idVehiculo,
      idConductor: input.idConductor,
      tipoTurno: input.tipoTurno,
      rentaTurno: input.rentaTurno,
      dias: input.dias,
      horario: input.horario,
    });
    if (!ok) throw new AsignacionNoEncontradaError();
  };
}
