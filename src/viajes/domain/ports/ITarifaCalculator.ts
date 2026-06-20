import type { Coordenada } from '../tipos.js';

export interface ITarifaCalculator {
  calcular(input: {
    idMunicipio: number;
    idZonaDestino?: number;
    destino?: Coordenada;
    origen?: Coordenada;
  }): Promise<{ tarifa: number; idZonaDestino: number | null; estimada: boolean }>;
}
