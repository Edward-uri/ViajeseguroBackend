import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import { calcularEstadoVerificacion, type EstadoVerificacion } from '../domain/tipos.js';
import { DocumentoNoEncontradoError } from '../domain/errors.js';
import type { DocumentoVehiculo } from '../domain/DocumentoVehiculo.js';

export function reviewDocumentoVehiculo(deps: {
  vehiculos: IVehiculoRepository;
  documentos: IDocumentoVehiculoRepository;
}) {
  return async (input: {
    idDocumento: number;
    estado: 'aprobado' | 'rechazado';
    motivoRechazo: string | null;
    adminId: number;
  }): Promise<{ documento: ReturnType<DocumentoVehiculo['toJSON']>; estadoVerificacion: EstadoVerificacion }> => {
    const doc = await deps.documentos.findById(input.idDocumento);
    if (!doc) throw new DocumentoNoEncontradoError();

    const actualizado = await deps.documentos.revisar({
      idDocumento: input.idDocumento,
      estado: input.estado,
      motivoRechazo: input.estado === 'rechazado' ? input.motivoRechazo : null,
      revisadoPor: input.adminId,
    });

    const docs = await deps.documentos.listarPorVehiculo(doc.idVehiculo);
    const estadoVerificacion = calcularEstadoVerificacion(new Map(docs.map((d) => [d.tipo, d.estado])));

    if (estadoVerificacion === 'aprobado') {
      await deps.vehiculos.registrarCambioEstatus({
        idVehiculo: doc.idVehiculo,
        estatus: 'activo',
        descripcion: 'Documentos aprobados',
      });
    }
    return { documento: actualizado.toJSON(), estadoVerificacion };
  };
}
