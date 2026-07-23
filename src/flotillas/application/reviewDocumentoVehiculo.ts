import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import type { IPushSender } from '../../viajes/domain/ports/IPushSender.js';
import { calcularEstadoVerificacion, type EstadoVerificacion } from '../domain/tipos.js';
import { DocumentoNoEncontradoError } from '../domain/errors.js';
import type { DocumentoVehiculo } from '../domain/DocumentoVehiculo.js';

export function reviewDocumentoVehiculo(deps: {
  vehiculos: IVehiculoRepository;
  documentos: IDocumentoVehiculoRepository;
  push: IPushSender;
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

    // Avisa al dueño el resultado de la revisión (best-effort: no rompe la revisión).
    const vehiculo = await deps.vehiculos.findById(doc.idVehiculo);
    if (vehiculo) {
      void notificar(deps.push, vehiculo.idPropietario, vehiculo.placa, input.estado, estadoVerificacion, input.motivoRechazo);
    }

    return { documento: actualizado.toJSON(), estadoVerificacion };
  };
}

async function notificar(
  push: IPushSender,
  idPropietario: number,
  placa: string,
  estado: 'aprobado' | 'rechazado',
  estadoVerificacion: EstadoVerificacion,
  motivoRechazo: string | null,
): Promise<void> {
  let titulo: string;
  let cuerpo: string;
  if (estado === 'rechazado') {
    titulo = 'Documento del vehículo rechazado';
    cuerpo = motivoRechazo
      ? `Un documento de tu vehículo ${placa} fue rechazado: ${motivoRechazo}. Vuelve a subirlo.`
      : `Un documento de tu vehículo ${placa} fue rechazado. Vuelve a subirlo desde la app.`;
  } else if (estadoVerificacion === 'aprobado') {
    titulo = '¡Vehículo aprobado!';
    cuerpo = `Tu vehículo ${placa} ya está aprobado y puede operar.`;
  } else {
    titulo = 'Documento del vehículo aprobado';
    cuerpo = `Un documento de tu vehículo ${placa} fue aprobado. Te avisamos cuando estén todos.`;
  }
  try {
    await push.enviar({ idUsuario: idPropietario, titulo, cuerpo, data: { tipo: 'revision_documentos_vehiculo', estadoVerificacion } });
  } catch {
    // Best-effort: si el push falla, la revisión ya quedó registrada.
  }
}
