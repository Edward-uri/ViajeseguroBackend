import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { VehiculoPublico } from '../domain/Vehiculo.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError, MunicipioNoValidoError } from '../domain/errors.js';

export function editarVehiculo(deps: {
  vehiculos: IVehiculoRepository;
  municipios: IMunicipioRepository;
}) {
  return async (input: {
    idVehiculo: number;
    idPropietario: number;
    modelo?: string;
    color?: string;
    anio?: number;
    idMunicipio?: number;
  }): Promise<VehiculoPublico> => {
    const vehiculo = await deps.vehiculos.findById(input.idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== input.idPropietario) throw new NoEsTuVehiculoError();

    if (input.idMunicipio != null && !(await deps.municipios.existeActivo(input.idMunicipio))) {
      throw new MunicipioNoValidoError();
    }

    const actualizado = await deps.vehiculos.actualizar({
      idVehiculo: input.idVehiculo,
      modelo: input.modelo ?? vehiculo.modelo,
      color: input.color ?? vehiculo.color,
      anio: input.anio ?? vehiculo.anio,
      idMunicipio: input.idMunicipio ?? vehiculo.idMunicipio,
    });
    return actualizado.toJSON();
  };
}
