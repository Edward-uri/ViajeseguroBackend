import type { Disponibilidad } from '../Disponibilidad.js';

export interface IDisponibilidadRepository {
  upsert(args: { idConductor: number; disponible: boolean; lat: number | null; lng: number | null }): Promise<Disponibilidad>;
  porConductor(idConductor: number): Promise<Disponibilidad | null>;
}
