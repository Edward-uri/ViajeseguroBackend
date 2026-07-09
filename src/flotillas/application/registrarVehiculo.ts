import type { IPropietarioRepository } from '../domain/repositories/IPropietarioRepository.js';
import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { IConductorRepository } from '../../conductores/domain/repositories/IConductorRepository.js';
import type { VehiculoPublico } from '../domain/Vehiculo.js';
import { MunicipioNoValidoError } from '../domain/errors.js';

export function registrarVehiculo(deps: {
  propietarios: IPropietarioRepository;
  vehiculos: IVehiculoRepository;
  municipios: IMunicipioRepository;
  conductores: IConductorRepository;
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
    const v = vehiculo.toJSON();

    // Autoasignación: si quien registra ya es conductor (tiene fila en `conductores`)
    // y todavía no tiene vehículo activo, este nuevo vehículo se lo asigna. No-fatal:
    // un fallo aquí no debe abortar el registro del vehículo, solo se loguea.
    try {
      const conductor = await deps.conductores.findById(input.idPropietario);
      if (conductor && (await deps.conductores.getVehiculoActivo(input.idPropietario)) === null) {
        await deps.conductores.setVehiculoActivo(input.idPropietario, v.idVehiculo);
      }
    } catch (err) {
      console.error('[registrarVehiculo] autoasignación de vehículo activo falló:', err);
    }

    return v;
  };
}
