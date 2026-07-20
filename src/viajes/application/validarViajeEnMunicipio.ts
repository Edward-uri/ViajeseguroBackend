import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';
import type { Coordenada } from '../domain/tipos.js';
import { ViajeFueraDelMunicipioError } from '../domain/errors.js';

/**
 * Regla de negocio: un viaje vive COMPLETO dentro de su municipio — origen y
 * destino deben quedar a menos de `radioKm` de alguna zona con centroide.
 * Sin zonas con centroide no hay perímetro contra qué validar: se deja pasar
 * con warning (el municipio debe capturar sus centroides desde el panel).
 */
export function validarViajeEnMunicipio(deps: { zonas: IZonaTarifaRepository; radioKm: number }) {
  return async (idMunicipio: number, origen: Coordenada, destino: Coordenada): Promise<void> => {
    const [zo, zd] = await Promise.all([
      deps.zonas.zonaMasCercana(idMunicipio, origen),
      deps.zonas.zonaMasCercana(idMunicipio, destino),
    ]);
    if (!zo || !zd) {
      console.warn(`[viajes] municipio ${idMunicipio} sin zonas con centroide: no se puede validar el perímetro`);
      return;
    }
    if (zo.distanciaKm > deps.radioKm || zd.distanciaKm > deps.radioKm) {
      throw new ViajeFueraDelMunicipioError();
    }
  };
}
