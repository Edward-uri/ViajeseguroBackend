import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { IDocumentoConductorRepository } from '../domain/repositories/IDocumentoConductorRepository.js';
import type { IPushSender } from '../../viajes/domain/ports/IPushSender.js';
import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import { calcularEstadoVerificacion, type EstadoVerificacion } from '../domain/tipos.js';
import { DocumentoNoEncontradoError } from '../domain/errors.js';

export function reviewDocumento(deps: {
  conductores: IConductorRepository;
  documentos: IDocumentoConductorRepository;
  push: IPushSender;
  users: IUserRepository;
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
      // Si addRol falla, todo el review falla y el admin reintenta (idempotente):
      // nunca debe quedar 'habilitado' sin el rol conductor.
      await deps.users.addRol(doc.idConductor, 'conductor');
      await deps.conductores.registrarCambioEstatus({
        idConductor: doc.idConductor,
        estatus: 'habilitado',
        descripcion: 'Documentos aprobados',
      });
    }

    // Avisa al conductor el resultado de la revisión (best-effort: no rompe la revisión).
    void notificar(deps.push, doc.idConductor, input.estado, estadoVerificacion, input.motivoRechazo);

    return { documento: actualizado.toJSON(), estadoVerificacion };
  };
}

async function notificar(
  push: IPushSender,
  idConductor: number,
  estado: 'aprobado' | 'rechazado',
  estadoVerificacion: EstadoVerificacion,
  motivoRechazo: string | null,
): Promise<void> {
  let titulo: string;
  let cuerpo: string;
  if (estado === 'rechazado') {
    titulo = 'Documento rechazado';
    cuerpo = motivoRechazo
      ? `Uno de tus documentos fue rechazado: ${motivoRechazo}. Vuelve a subirlo.`
      : 'Uno de tus documentos fue rechazado. Vuelve a subirlo desde la app.';
  } else if (estadoVerificacion === 'aprobado') {
    titulo = '¡Documentos aprobados!';
    cuerpo = 'Ya puedes registrar tu vehículo y empezar a recibir viajes.';
  } else {
    titulo = 'Documento aprobado';
    cuerpo = 'Uno de tus documentos fue aprobado. Te avisamos cuando estén todos.';
  }
  try {
    await push.enviar({ idUsuario: idConductor, titulo, cuerpo, data: { tipo: 'revision_documentos', estadoVerificacion } });
  } catch {
    // Best-effort: si el push falla, la revisión ya quedó registrada.
  }
}
