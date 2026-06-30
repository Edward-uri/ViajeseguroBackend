import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import { calcularEstadoVerificacion, type EstadoVerificacion } from '../domain/tipos.js';

/** Estado de verificación de un vehículo a partir de sus documentos requeridos. */
export function estadoVehiculo(deps: { documentos: IDocumentoVehiculoRepository }) {
  return async ({ idVehiculo }: { idVehiculo: number }): Promise<EstadoVerificacion> => {
    const docs = await deps.documentos.listarPorVehiculo(idVehiculo);
    return calcularEstadoVerificacion(new Map(docs.map((d) => [d.tipo, d.estado])));
  };
}
