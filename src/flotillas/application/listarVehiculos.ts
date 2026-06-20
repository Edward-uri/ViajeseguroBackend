import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import { calcularEstadoVerificacion, type EstadoVerificacion } from '../domain/tipos.js';

export interface VehiculoResumen {
  idVehiculo: number;
  placa: string;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  idMunicipio: number;
  estadoVerificacion: EstadoVerificacion;
}

export function listarVehiculos(deps: {
  vehiculos: IVehiculoRepository;
  documentos: IDocumentoVehiculoRepository;
}) {
  return async ({ idPropietario }: { idPropietario: number }): Promise<VehiculoResumen[]> => {
    const vehiculos = await deps.vehiculos.listarPorPropietario(idPropietario);
    return Promise.all(
      vehiculos.map(async (v) => {
        const docs = await deps.documentos.listarPorVehiculo(v.idVehiculo);
        const estado = calcularEstadoVerificacion(new Map(docs.map((d) => [d.tipo, d.estado])));
        return {
          idVehiculo: v.idVehiculo,
          placa: v.placa,
          modelo: v.modelo,
          color: v.color,
          anio: v.anio,
          idMunicipio: v.idMunicipio,
          estadoVerificacion: estado,
        };
      }),
    );
  };
}
