import type { IPropietarioRepository } from '../domain/repositories/IPropietarioRepository.js';
import type { PropietarioPublico } from '../domain/Propietario.js';

export function getPerfil(deps: { propietarios: IPropietarioRepository }) {
  return async ({ idPropietario }: { idPropietario: number }): Promise<PropietarioPublico> => {
    await deps.propietarios.asegurarExiste(idPropietario);
    const p = await deps.propietarios.findById(idPropietario);
    return p!.toJSON();
  };
}
