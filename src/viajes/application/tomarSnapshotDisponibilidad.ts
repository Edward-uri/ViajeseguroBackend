import type { ISenalesMlRepository } from '../domain/repositories/ISenalesMlRepository.js';

/** Copia la foto actual de conductor_disponibilidad al historial. Devuelve filas copiadas. */
export function tomarSnapshotDisponibilidad(deps: { senales: ISenalesMlRepository }) {
  return (): Promise<number> => deps.senales.copiarDisponibilidadActual();
}
