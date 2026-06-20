import type { IVehiculoRepository, VehiculoPendiente } from '../domain/repositories/IVehiculoRepository.js';

export function listVehiculosPendientes(deps: { vehiculos: IVehiculoRepository }) {
  return async (): Promise<VehiculoPendiente[]> => deps.vehiculos.listarConPendientes();
}
