import type { IZonaAdminRepository } from '../domain/repositories/IZonaAdminRepository.js';
import type { ZonaAdmin } from '../domain/Zona.js';

export function crearZona(deps: { zonasAdmin: IZonaAdminRepository }) {
  return (args: {
    idMunicipio: number; nombre: string; precio: number;
    latCentro: number | null; lngCentro: number | null;
  }): Promise<ZonaAdmin> => deps.zonasAdmin.crear(args);
}
