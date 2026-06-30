import type { Coordenada } from '../domain/tipos.js';
import type { ITarifaCalculator } from '../domain/ports/ITarifaCalculator.js';
import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';

export class TarifaPorZona implements ITarifaCalculator {
  constructor(private zonas: IZonaTarifaRepository) {}

  async calcular(input: {
    idMunicipio: number;
    personas: number;
    idZonaDestino?: number;
    destino?: Coordenada;
    origen?: Coordenada;
  }): Promise<{ tarifa: number; tarifaPorPersona: number; idZonaDestino: number | null; estimada: boolean }> {
    // El precio SIEMPRE sale fijo de la tabla de tarifas (nunca calculado por km).
    let precio: number | null = null;
    let idZonaDestino: number | null = null;
    let estimada = false;

    if (input.idZonaDestino) {
      const t = await this.zonas.tarifaDeZona(input.idZonaDestino);
      if (t) { precio = t.precio; idZonaDestino = input.idZonaDestino; }
    }
    if (precio == null && input.destino) {
      const z = await this.zonas.zonaMasCercana(input.idMunicipio, input.destino);
      if (z) { precio = z.precio; idZonaDestino = z.idZona; }
    }
    if (precio == null) {
      // Sin zona resuelta -> precio fijo por defecto del municipio (municipios.tarifa_default).
      precio = await this.zonas.tarifaDefault(input.idMunicipio);
      if (precio == null) throw new Error(`municipio ${input.idMunicipio} sin tarifa_default`);
      estimada = true;
    }

    // Mismo precio por cada pasajero. El valor de tabla ya es fijo -> sin decimales inventados.
    return { tarifa: precio * input.personas, tarifaPorPersona: precio, idZonaDestino, estimada };
  }
}
