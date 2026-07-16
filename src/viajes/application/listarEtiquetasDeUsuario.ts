import type { IEtiquetaRepository, RolEtiqueta, EtiquetaAgregada } from '../domain/repositories/IEtiquetaRepository.js';

/** Top de etiquetas del perfil (ventana y umbrales viven en el repositorio). */
export function listarEtiquetasDeUsuario(deps: { etiquetas: IEtiquetaRepository }) {
  return (idUsuario: number, rol: RolEtiqueta): Promise<EtiquetaAgregada[]> =>
    deps.etiquetas.topDeUsuario(idUsuario, rol);
}
