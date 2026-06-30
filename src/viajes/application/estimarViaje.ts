import type { ITarifaCalculator } from '../domain/ports/ITarifaCalculator.js';
import type { IRouteEstimator } from '../domain/ports/IRouteEstimator.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { RutaGeoJSON } from '../domain/tipos.js';
import { MunicipioInvalidoError } from '../domain/errors.js';

export interface EstimarViajeDTO {
  idMunicipio: number;
  origen: { lat: number; lng: number; texto?: string | null };
  destino: { lat: number; lng: number; texto?: string | null };
  idZonaDestino?: number;
  personas: number;
}

export interface EstimacionViaje {
  distanciaKm: number;
  duracionMin: number;
  personas: number;
  tarifaPorPersona: number;
  tarifa: number;
  tarifaEstimada: boolean;
  idZonaDestino: number | null;
  ruta: RutaGeoJSON | null;
}

export function estimarViaje(deps: {
  tarifas: ITarifaCalculator;
  municipios: IMunicipioRepository;
  rutas: IRouteEstimator;
}) {
  return async (input: EstimarViajeDTO): Promise<EstimacionViaje> => {
    if (!(await deps.municipios.existeActivo(input.idMunicipio))) throw new MunicipioInvalidoError();

    const origen = { lat: input.origen.lat, lng: input.origen.lng };
    const destino = { lat: input.destino.lat, lng: input.destino.lng };

    const r = await deps.rutas.estimar(origen, destino);
    const t = await deps.tarifas.calcular({
      idMunicipio: input.idMunicipio,
      personas: input.personas,
      idZonaDestino: input.idZonaDestino,
      origen,
      destino,
    });

    return {
      distanciaKm: r.distanciaKm,
      duracionMin: r.duracionMin,
      personas: input.personas,
      tarifaPorPersona: t.tarifaPorPersona,
      tarifa: t.tarifa,
      tarifaEstimada: t.estimada,
      idZonaDestino: t.idZonaDestino,
      ruta: r.geometria,
    };
  };
}
