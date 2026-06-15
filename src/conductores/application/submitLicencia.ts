import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { Conductor } from '../domain/Conductor.js';

export function submitLicencia(deps: { conductores: IConductorRepository }) {
  return async (input: {
    idConductor: number;
    licencia: string;
    licenciaFechaExpedicion: string;
    licenciaFechaVencimiento: string;
  }): Promise<Conductor> => {
    return deps.conductores.upsertLicencia({
      idConductor: input.idConductor,
      licencia: input.licencia,
      fechaExpedicion: input.licenciaFechaExpedicion,
      fechaVencimiento: input.licenciaFechaVencimiento,
    });
  };
}
