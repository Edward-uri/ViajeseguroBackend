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
    // El precio SIEMPRE sale fijo de la tabla (nunca por km). Se cobra la zona
    // MÁS CARA entre origen y destino: tarifa simétrica (A→B = B→A) y los
    // trayectos hacia/desde extremos cobran lo del extremo, no lo del centro.
    const candidatos: number[] = [];
    let idZonaDestino: number | null = null;
    let estimada = false;

    if (input.idZonaDestino) {
      const t = await this.zonas.tarifaDeZona(input.idZonaDestino);
      if (t) { candidatos.push(t.precio); idZonaDestino = input.idZonaDestino; }
    }
    if (idZonaDestino == null && input.destino) {
      const z = await this.zonas.zonaMasCercana(input.idMunicipio, input.destino);
      if (z) { candidatos.push(z.precio); idZonaDestino = z.idZona; }
    }
    if (input.origen) {
      const zo = await this.zonas.zonaMasCercana(input.idMunicipio, input.origen);
      if (zo) candidatos.push(zo.precio);
    }

    let precio: number | null = candidatos.length ? Math.max(...candidatos) : null;
    if (precio == null) {
      // Sin zona resuelta -> precio fijo por defecto del municipio (municipios.tarifa_default).
      console.warn(`[tarifa] municipio ${input.idMunicipio}: sin zona resuelta para el destino — usando tarifa_default (¿zonas sin centroide?)`);
      precio = await this.zonas.tarifaDefault(input.idMunicipio);
      if (precio == null) throw new Error(`municipio ${input.idMunicipio} sin tarifa_default`);
      estimada = true;
    }

    // Mismo precio por cada pasajero. El valor de tabla ya es fijo -> sin decimales inventados.
    return { tarifa: precio * input.personas, tarifaPorPersona: precio, idZonaDestino, estimada };
  }
}
