import type { IBolsaRepository } from '../domain/repositories/IBolsaRepository.js';
import type { IVehiculoRepository } from '../../flotillas/domain/repositories/IVehiculoRepository.js';
import type { TipoTurno, Vacante } from '../domain/Vacante.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError } from '../../flotillas/domain/errors.js';

export function crearVacante(deps: {
  bolsa: IBolsaRepository;
  vehiculos: Pick<IVehiculoRepository, 'findById'>;
}) {
  return async (input: {
    idPropietario: number;
    idVehiculo: number;
    tipoTurno: TipoTurno;
    rentaTurno: number;
    dias: string[];
    horario: string | null;
    condiciones: string | null;
  }): Promise<Vacante> => {
    const vehiculo = await deps.vehiculos.findById(input.idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== input.idPropietario) throw new NoEsTuVehiculoError();

    return deps.bolsa.crearVacante({
      idPropietario: input.idPropietario,
      idVehiculo: input.idVehiculo,
      idMunicipio: vehiculo.idMunicipio,
      tipoTurno: input.tipoTurno,
      rentaTurno: input.rentaTurno,
      dias: input.dias,
      horario: input.horario,
      condiciones: input.condiciones,
    });
  };
}
