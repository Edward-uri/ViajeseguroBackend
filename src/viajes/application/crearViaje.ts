import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { ITarifaCalculator } from '../domain/ports/ITarifaCalculator.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { MunicipioInvalidoError } from '../domain/errors.js';

export interface CrearViajeDTO {
  idPasajero: number;
  idMunicipio: number;
  origen: { lat: number; lng: number; texto?: string | null };
  destino: { lat: number; lng: number; texto?: string | null };
  idZonaDestino?: number;
}

export function crearViaje(deps: {
  viajes: IViajeRepository;
  tarifas: ITarifaCalculator;
  municipios: IMunicipioRepository;
  notifier: IEventoViajeNotifier;
}) {
  return async (input: CrearViajeDTO): Promise<PublicViaje> => {
    if (!(await deps.municipios.existeActivo(input.idMunicipio))) throw new MunicipioInvalidoError();

    const t = await deps.tarifas.calcular({
      idMunicipio: input.idMunicipio,
      idZonaDestino: input.idZonaDestino,
      origen: { lat: input.origen.lat, lng: input.origen.lng },
      destino: { lat: input.destino.lat, lng: input.destino.lng },
    });

    const viaje = await deps.viajes.crear({
      idPasajero: input.idPasajero,
      idMunicipio: input.idMunicipio,
      origen: input.origen,
      destino: input.destino,
      idZonaDestino: t.idZonaDestino,
      distanciaKm: null,
      tarifa: t.tarifa,
      tarifaEstimada: t.estimada,
    });
    await deps.notifier.viajeSolicitado(viaje.toJSON());
    return viaje.toJSON();
  };
}
