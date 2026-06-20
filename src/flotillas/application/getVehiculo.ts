import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import {
  REQUERIDOS_VEHICULO,
  OPCIONALES_VEHICULO,
  TIPOS_VEHICULO,
  calcularEstadoVerificacion,
  type EstadoDocumento,
  type EstadoVerificacion,
  type TipoDocumentoVehiculo,
} from '../domain/tipos.js';
import { VehiculoNoEncontradoError, NoEsTuVehiculoError } from '../domain/errors.js';

interface DocItem {
  tipo: TipoDocumentoVehiculo;
  estado: EstadoDocumento | 'faltante';
  idDocumento?: number | null;
  motivoRechazo?: string | null;
}

export function getVehiculo(deps: {
  vehiculos: IVehiculoRepository;
  documentos: IDocumentoVehiculoRepository;
}) {
  return async ({ idVehiculo, solicitante }: {
    idVehiculo: number;
    solicitante: { idUsuario: number; esAdmin: boolean };
  }): Promise<{
    idVehiculo: number;
    placa: string;
    modelo: string | null;
    color: string | null;
    anio: number | null;
    idMunicipio: number;
    estadoVerificacion: EstadoVerificacion;
    requeridos: TipoDocumentoVehiculo[];
    opcionales: TipoDocumentoVehiculo[];
    documentos: DocItem[];
  }> => {
    const vehiculo = await deps.vehiculos.findById(idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (!solicitante.esAdmin && vehiculo.idPropietario !== solicitante.idUsuario) {
      throw new NoEsTuVehiculoError();
    }

    const docs = await deps.documentos.listarPorVehiculo(idVehiculo);
    const estadosPorTipo = new Map(docs.map((d) => [d.tipo, d.estado]));

    const documentos: DocItem[] = TIPOS_VEHICULO.map((tipo) => {
      const d = docs.find((x) => x.tipo === tipo);
      return d
        ? { tipo, idDocumento: d.idDocumento, estado: d.estado, motivoRechazo: d.motivoRechazo }
        : { tipo, estado: 'faltante' };
    });

    return {
      idVehiculo: vehiculo.idVehiculo,
      placa: vehiculo.placa,
      modelo: vehiculo.modelo,
      color: vehiculo.color,
      anio: vehiculo.anio,
      idMunicipio: vehiculo.idMunicipio,
      estadoVerificacion: calcularEstadoVerificacion(estadosPorTipo),
      requeridos: REQUERIDOS_VEHICULO,
      opcionales: OPCIONALES_VEHICULO,
      documentos,
    };
  };
}
