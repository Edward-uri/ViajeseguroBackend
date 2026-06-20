import type { IMunicipioRepository } from '../domain/repositories/IMunicipioRepository.js';
import type { MunicipioPublico } from '../domain/Municipio.js';

export function listMunicipios(deps: { municipios: IMunicipioRepository }) {
  return async (): Promise<MunicipioPublico[]> => {
    const municipios = await deps.municipios.listarActivos();
    return municipios.map((m) => m.toPublicJSON());
  };
}
