import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { IDocumentoConductorRepository } from '../domain/repositories/IDocumentoConductorRepository.js';
import { calcularEstadoVerificacion, type EstadoVerificacion } from '../domain/tipos.js';
import { DocumentoNoEncontradoError } from '../domain/errors.js';

export function reviewDocumento(deps: {
  conductores: IConductorRepository;
  documentos: IDocumentoConductorRepository;
}) {
  return async (input: {
    idDocumento: number;
    estado: 'aprobado' | 'rechazado';
    motivoRechazo: string | null;
    adminId: number;
  }): Promise<{ documento: ReturnType<import('../domain/DocumentoConductor.js').DocumentoConductor['toJSON']>; estadoVerificacion: EstadoVerificacion }> => {
    const doc = await deps.documentos.findById(input.idDocumento);
    if (!doc) throw new DocumentoNoEncontradoError();

    const actualizado = await deps.documentos.revisar({
      idDocumento: input.idDocumento,
      estado: input.estado,
      motivoRechazo: input.estado === 'rechazado' ? input.motivoRechazo : null,
      revisadoPor: input.adminId,
    });

    const docs = await deps.documentos.listarPorConductor(doc.idConductor);
    const estadoVerificacion = calcularEstadoVerificacion(new Map(docs.map((d) => [d.tipo, d.estado])));

    if (estadoVerificacion === 'aprobado') {
      await deps.conductores.registrarCambioEstatus({
        idConductor: doc.idConductor,
        estatus: 'habilitado',
        descripcion: 'Documentos aprobados',
      });
    }
    return { documento: actualizado.toJSON(), estadoVerificacion };
  };
}
