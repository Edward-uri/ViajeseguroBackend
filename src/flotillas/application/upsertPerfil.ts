import type { IPropietarioRepository } from '../domain/repositories/IPropietarioRepository.js';
import type { PropietarioPublico } from '../domain/Propietario.js';

export function upsertPerfil(deps: { propietarios: IPropietarioRepository }) {
  return async (input: { idPropietario: number; rfc: string | null; razonSocial: string | null }): Promise<PropietarioPublico> => {
    const p = await deps.propietarios.upsertPerfil(input);
    return p.toJSON();
  };
}
