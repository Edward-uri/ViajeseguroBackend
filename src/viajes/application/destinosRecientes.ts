import type { IViajeRepository } from '../domain/repositories/IViajeRepository.js';

// ponytail: límite fijo en 3 (lo que pinta la app); parametrizar si algún día piden más.
const LIMITE = 3;

export function destinosRecientes(deps: { viajes: IViajeRepository }) {
  return (idPasajero: number): Promise<{ lat: number; lng: number; texto: string | null }[]> =>
    deps.viajes.destinosRecientes(idPasajero, LIMITE);
}
