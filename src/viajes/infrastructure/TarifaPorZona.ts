import type { Coordenada } from '../domain/tipos.js';
import { BANDERAZO, PRECIO_KM } from '../domain/tipos.js';
import type { ITarifaCalculator } from '../domain/ports/ITarifaCalculator.js';
import type { IRouteEstimator } from '../domain/ports/IRouteEstimator.js';
import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';

export class TarifaPorZona implements ITarifaCalculator {
  constructor(private zonas: IZonaTarifaRepository, private rutas: IRouteEstimator) {}

  async calcular(input: {
    idMunicipio: number;
    idZonaDestino?: number;
    destino?: Coordenada;
    origen?: Coordenada;
  }): Promise<{ tarifa: number; idZonaDestino: number | null; estimada: boolean }> {
    if (input.idZonaDestino) {
      const t = await this.zonas.tarifaDeZona(input.idZonaDestino);
      if (t) return { tarifa: Number(t.precio), idZonaDestino: input.idZonaDestino, estimada: false };
    }
    if (input.destino) {
      const z = await this.zonas.zonaMasCercana(input.idMunicipio, input.destino);
      if (z) return { tarifa: Number(z.precio), idZonaDestino: z.idZona, estimada: false };
    }
    if (input.origen && input.destino) {
      const { distanciaKm } = await this.rutas.estimar(input.origen, input.destino);
      const tarifa = Math.round((BANDERAZO + distanciaKm * PRECIO_KM) * 100) / 100;
      return { tarifa, idZonaDestino: null, estimada: true };
    }
    return { tarifa: BANDERAZO, idZonaDestino: null, estimada: true };
  }
}
