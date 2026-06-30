import type { Coordenada } from '../tipos.js';

export interface ITarifaCalculator {
  calcular(input: {
    idMunicipio: number;
    personas: number;
    idZonaDestino?: number;
    destino?: Coordenada;
    origen?: Coordenada;
  }): Promise<{ tarifa: number; tarifaPorPersona: number; idZonaDestino: number | null; estimada: boolean }>;
}
