import type { IZonaAdminRepository } from '../domain/repositories/IZonaAdminRepository.js';
import type { ZonaAdmin } from '../domain/Zona.js';

export function listarZonasAdmin(deps: { zonasAdmin: IZonaAdminRepository }) {
  return (idMunicipio: number): Promise<ZonaAdmin[]> => deps.zonasAdmin.listarAdmin(idMunicipio);
}
