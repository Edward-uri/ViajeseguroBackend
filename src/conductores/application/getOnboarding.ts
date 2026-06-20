import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { IDocumentoConductorRepository } from '../domain/repositories/IDocumentoConductorRepository.js';
import {
  REQUERIDOS,
  calcularEstadoVerificacion,
  type EstadoDocumento,
  type EstadoVerificacion,
  type TipoDocumento,
} from '../domain/tipos.js';

interface DocItem {
  tipo: TipoDocumento;
  estado: EstadoDocumento | 'faltante';
  idDocumento?: number | null;
  motivoRechazo?: string | null;
}

export function getOnboarding(deps: {
  conductores: IConductorRepository;
  documentos: IDocumentoConductorRepository;
}) {
  return async ({ idConductor }: { idConductor: number }): Promise<{
    estadoVerificacion: EstadoVerificacion;
    licencia: { numero: string; expedicion: string | null; vence: string | null } | null;
    requeridos: TipoDocumento[];
    documentos: DocItem[];
  }> => {
    const conductor = await deps.conductores.findById(idConductor);
    const docs = await deps.documentos.listarPorConductor(idConductor);
    const estadosPorTipo = new Map(docs.map((d) => [d.tipo, d.estado]));

    const documentos: DocItem[] = REQUERIDOS.map((tipo) => {
      const d = docs.find((x) => x.tipo === tipo);
      return d
        ? { tipo, idDocumento: d.idDocumento, estado: d.estado, motivoRechazo: d.motivoRechazo }
        : { tipo, estado: 'faltante' };
    });

    return {
      estadoVerificacion: calcularEstadoVerificacion(estadosPorTipo),
      licencia: conductor?.licencia
        ? { numero: conductor.licencia, expedicion: conductor.licenciaFechaExpedicion, vence: conductor.licenciaFechaVencimiento }
        : null,
      requeridos: REQUERIDOS,
      documentos,
    };
  };
}
