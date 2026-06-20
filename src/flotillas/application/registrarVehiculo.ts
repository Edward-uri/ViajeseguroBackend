import type { IPropietarioRepository } from '../domain/repositories/IPropietarioRepository.js';
import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { VehiculoPublico } from '../domain/Vehiculo.js';
import { MunicipioNoValidoError } from '../domain/errors.js';

export function registrarVehiculo(deps: {
  propietarios: IPropietarioRepository;
  vehiculos: IVehiculoRepository;
  municipios: IMunicipioRepository;
}) {
  return async (input: {
    idPropietario: number;
    placa: string;
    modelo: string | null;
    color: string | null;
    anio: number | null;
    idMunicipio: number;
  }): Promise<VehiculoPublico> => {
    if (!(await deps.municipios.existeActivo(input.idMunicipio))) {
      throw new MunicipioNoValidoError();
    }
    await deps.propietarios.asegurarExiste(input.idPropietario);
    const vehiculo = await deps.vehiculos.crear(input);
    return vehiculo.toJSON();
  };
}
