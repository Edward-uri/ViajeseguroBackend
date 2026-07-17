import type { IDireccionRepository, CrearDireccionInput } from '../domain/repositories/IDireccionRepository.js';

export const listarDirecciones = (deps: { direcciones: IDireccionRepository }) =>
  (idUsuario: number) => deps.direcciones.listar(idUsuario);

export const crearDireccion = (deps: { direcciones: IDireccionRepository }) =>
  (idUsuario: number, input: CrearDireccionInput) => deps.direcciones.crear(idUsuario, input);

export const eliminarDireccion = (deps: { direcciones: IDireccionRepository }) =>
  (idUsuario: number, idDireccion: number) => deps.direcciones.eliminar(idUsuario, idDireccion);
