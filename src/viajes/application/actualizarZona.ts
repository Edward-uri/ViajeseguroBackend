import type { IZonaAdminRepository } from '../domain/repositories/IZonaAdminRepository.js';
import type { ZonaAdmin } from '../domain/Zona.js';
import { ZonaNoEncontradaError } from '../domain/errors.js';

export function actualizarZona(deps: { zonasAdmin: IZonaAdminRepository }) {
  return async (args: {
    idZona: number; idMunicipio: number;
    nombre?: string; precio?: number;
    latCentro?: number | null; lngCentro?: number | null; activo?: boolean;
  }): Promise<ZonaAdmin> => {
    const zona = await deps.zonasAdmin.actualizar(args);
    if (!zona) throw new ZonaNoEncontradaError();
    return zona;
  };
}
