import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';
import type { ITarifaCalculator } from '../domain/ports/ITarifaCalculator.js';
import type { IEventoViajeNotifier } from '../domain/ports/IEventoViajeNotifier.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { IRouteEstimator } from '../domain/ports/IRouteEstimator.js';
import type { PublicViaje } from '../domain/Viaje.js';
import { MunicipioInvalidoError } from '../domain/errors.js';

export interface CrearViajeDTO {
  idPasajero: number;
  idMunicipio: number;
  origen: { lat: number; lng: number; texto?: string | null };
  destino: { lat: number; lng: number; texto?: string | null };
  idZonaDestino?: number;
  personas: number;
}

export function crearViaje(deps: {
  viajes: IViajeRepository;
  tarifas: ITarifaCalculator;
  municipios: IMunicipioRepository;
  notifier: IEventoViajeNotifier;
  rutas: IRouteEstimator;
}) {
  return async (input: CrearViajeDTO): Promise<PublicViaje> => {
    if (!(await deps.municipios.existeActivo(input.idMunicipio))) throw new MunicipioInvalidoError();

    const origen = { lat: input.origen.lat, lng: input.origen.lng };
    const destino = { lat: input.destino.lat, lng: input.destino.lng };

    const { distanciaKm } = await deps.rutas.estimar(origen, destino);
    const t = await deps.tarifas.calcular({
      idMunicipio: input.idMunicipio,
      personas: input.personas,
      idZonaDestino: input.idZonaDestino,
      origen,
      destino,
    });

    const viaje = await deps.viajes.crear({
      idPasajero: input.idPasajero,
      idMunicipio: input.idMunicipio,
      origen: input.origen,
      destino: input.destino,
      idZonaDestino: t.idZonaDestino,
      distanciaKm,
      numPasajeros: input.personas,
      tarifa: t.tarifa,
      tarifaEstimada: t.estimada,
    });
    await deps.notifier.viajeSolicitado(viaje.toJSON());
    return viaje.toJSON();
  };
}
