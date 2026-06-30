import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { IDocumentoConductorRepository } from '../domain/repositories/IDocumentoConductorRepository.js';
import {
  REQUERIDOS,
  calcularEstadoVerificacion,
  combinarEstado,
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

export interface VehiculoOnboarding {
  idVehiculo: number;
  placa: string;
  estadoVerificacion: EstadoVerificacion;
}

export function getOnboarding(deps: {
  conductores: IConductorRepository;
  documentos: IDocumentoConductorRepository;
  /** Vehículo PROPIO del conductor (o null si aún no registra uno). Lo provee flotillas. */
  vehiculoDelConductor: (idConductor: number) => Promise<VehiculoOnboarding | null>;
}) {
  return async ({ idConductor }: { idConductor: number }): Promise<{
    estadoVerificacion: EstadoVerificacion;
    estadoGlobal: EstadoVerificacion;
    licencia: { numero: string; expedicion: string | null; vence: string | null } | null;
    requeridos: TipoDocumento[];
    documentos: DocItem[];
    vehiculo: VehiculoOnboarding | null;
  }> => {
    const conductor = await deps.conductores.findById(idConductor);
    const docs = await deps.documentos.listarPorConductor(idConductor);
    const estadosPorTipo = new Map(docs.map((d) => [d.tipo, d.estado]));
    const vehiculo = await deps.vehiculoDelConductor(idConductor);

    const documentos: DocItem[] = REQUERIDOS.map((tipo) => {
      const d = docs.find((x) => x.tipo === tipo);
      return d
        ? { tipo, idDocumento: d.idDocumento, estado: d.estado, motivoRechazo: d.motivoRechazo }
        : { tipo, estado: 'faltante' };
    });

    const estadoDocs = calcularEstadoVerificacion(estadosPorTipo);
    // Global = docs del conductor + vehículo. Sin vehículo registrado → incompleto (no puede operar).
    const estadoGlobal = combinarEstado(estadoDocs, vehiculo?.estadoVerificacion ?? 'incompleto');

    return {
      estadoVerificacion: estadoDocs,
      estadoGlobal,
      licencia: conductor?.licencia
        ? { numero: conductor.licencia, expedicion: conductor.licenciaFechaExpedicion, vence: conductor.licenciaFechaVencimiento }
        : null,
      requeridos: REQUERIDOS,
      documentos,
      vehiculo,
    };
  };
}
