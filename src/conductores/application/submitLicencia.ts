import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { Conductor } from '../domain/Conductor.js';
import { MunicipioNoValidoError } from '../domain/errors.js';

export function submitLicencia(deps: {
  conductores: IConductorRepository;
  municipios: IMunicipioRepository;
}) {
  return async (input: {
    idConductor: number;
    idMunicipio: number;
    licencia: string;
    licenciaFechaExpedicion: string;
    licenciaFechaVencimiento: string;
  }): Promise<Conductor> => {
    if (!(await deps.municipios.existeActivo(input.idMunicipio))) {
      throw new MunicipioNoValidoError();
    }
    return deps.conductores.upsertLicencia({
      idConductor: input.idConductor,
      idMunicipio: input.idMunicipio,
      licencia: input.licencia,
      fechaExpedicion: input.licenciaFechaExpedicion,
      fechaVencimiento: input.licenciaFechaVencimiento,
    });
  };
}
