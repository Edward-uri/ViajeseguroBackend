import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';
import type { IMunicipioRepository } from '../../municipios/domain/repositories/IMunicipioRepository.js';
import type { Coordenada } from '../domain/tipos.js';
import { puntoEnPerimetro } from '../domain/geo.js';
import { ViajeFueraDelMunicipioError } from '../domain/errors.js';

/**
 * Regla: el viaje vive COMPLETO dentro de su municipio.
 * 1) Con perímetro cargado (municipios.perimetro): point-in-polygon exacto.
 * 2) Sin perímetro: fallback al radio sobre centroides de zona (aproximado).
 * 3) Sin perímetro NI centroides: se deja pasar con warning.
 */
export function validarViajeEnMunicipio(deps: {
  zonas: IZonaTarifaRepository;
  municipios: IMunicipioRepository;
  radioKm: number;
}) {
  return async (idMunicipio: number, origen: Coordenada, destino: Coordenada): Promise<void> => {
    const perimetro = await deps.municipios.perimetroDe(idMunicipio);
    if (perimetro) {
      if (!puntoEnPerimetro(origen, perimetro) || !puntoEnPerimetro(destino, perimetro)) {
        throw new ViajeFueraDelMunicipioError();
      }
      return;
    }

    const [zo, zd] = await Promise.all([
      deps.zonas.zonaMasCercana(idMunicipio, origen),
      deps.zonas.zonaMasCercana(idMunicipio, destino),
    ]);
    if (!zo || !zd) {
      console.warn(`[viajes] municipio ${idMunicipio} sin perimetro ni centroides: no se puede validar`);
      return;
    }
    if (zo.distanciaKm > deps.radioKm || zd.distanciaKm > deps.radioKm) {
      throw new ViajeFueraDelMunicipioError();
    }
  };
}
