import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import type { IAsignacionRepository } from '../domain/repositories/IAsignacionRepository.js';
import type { IConductorRepository } from '../../conductores/domain/repositories/IConductorRepository.js';
import { calcularEstadoVerificacion, type EstadoVerificacion } from '../domain/tipos.js';

export interface VehiculoResumen {
  idVehiculo: number;
  placa: string;
  numeroSerie: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  idMunicipio: number;
  estadoVerificacion: EstadoVerificacion;
  origen: 'propio' | 'asignado';
  activo: boolean;
  conductoresAsignados: number;
}

export function listarVehiculos(deps: {
  vehiculos: IVehiculoRepository;
  documentos: IDocumentoVehiculoRepository;
  asignaciones: IAsignacionRepository;
  conductores: Pick<IConductorRepository, 'getVehiculoActivo'>;
}) {
  return async ({ idPropietario }: { idPropietario: number }): Promise<VehiculoResumen[]> => {
    const propios = await deps.vehiculos.listarPorPropietario(idPropietario);
    const propiosIds = new Set(propios.map((v) => v.idVehiculo));

    const asignadosIds = await deps.asignaciones.vehiculosAsignados(idPropietario);
    const asignados = (
      await Promise.all(asignadosIds.filter((id) => !propiosIds.has(id)).map((id) => deps.vehiculos.findById(id)))
    ).filter((v): v is NonNullable<typeof v> => v != null);

    const filas: Array<{ v: typeof propios[number]; origen: 'propio' | 'asignado' }> = [
      ...propios.map((v) => ({ v, origen: 'propio' as const })),
      ...asignados.map((v) => ({ v, origen: 'asignado' as const })),
    ];

    const idVehiculoActivo = await deps.conductores.getVehiculoActivo(idPropietario);
    const conductoresPorVehiculo = await deps.asignaciones.contarActivosPorVehiculos(
      filas.map((f) => f.v.idVehiculo),
    );

    return Promise.all(
      filas.map(async ({ v, origen }) => {
        const docs = await deps.documentos.listarPorVehiculo(v.idVehiculo);
        const estado = calcularEstadoVerificacion(new Map(docs.map((d) => [d.tipo, d.estado])));
        return {
          idVehiculo: v.idVehiculo,
          placa: v.placa,
          numeroSerie: v.numeroSerie,
          modelo: v.modelo,
          color: v.color,
          anio: v.anio,
          idMunicipio: v.idMunicipio,
          estadoVerificacion: estado,
          origen,
          activo: v.idVehiculo === idVehiculoActivo,
          conductoresAsignados: conductoresPorVehiculo[v.idVehiculo] ?? 0,
        };
      }),
    );
  };
}
