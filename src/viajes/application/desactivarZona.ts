import type { IZonaAdminRepository } from '../domain/repositories/IZonaAdminRepository.js';
import { ZonaNoEncontradaError } from '../domain/errors.js';

export function desactivarZona(deps: { zonasAdmin: IZonaAdminRepository }) {
  return async (args: { idZona: number; idMunicipio: number }): Promise<void> => {
    const ok = await deps.zonasAdmin.desactivar(args);
    if (!ok) throw new ZonaNoEncontradaError();
  };
}
