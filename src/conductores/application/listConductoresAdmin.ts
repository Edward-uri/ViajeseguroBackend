import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { IAsignacionRepository } from '../../flotillas/domain/repositories/IAsignacionRepository.js';
import type { IVehiculoRepository } from '../../flotillas/domain/repositories/IVehiculoRepository.js';
import { calcularEstadoVerificacion, type EstadoDocumento, type TipoDocumento, type EstadoVerificacion } from '../domain/tipos.js';

export interface ConductorAdmin {
  idConductor: number;
  nombre: string;
  telefono: string | null;
  idMunicipio: number | null;
  municipio: string | null;
  estadoVerificacion: EstadoVerificacion;
  estadoCuenta: string;
  vehiculos: { idVehiculo: number; placa: string; modelo: string | null; activo: boolean }[];
}

/** Listado admin de todos los conductores con su estado y vehículos asignados. */
export function listConductoresAdmin(deps: {
  conductores: IConductorRepository;
  asignaciones: IAsignacionRepository;
  vehiculos: IVehiculoRepository;
}) {
  return async (filtroEstado?: EstadoVerificacion): Promise<ConductorAdmin[]> => {
    const filas = await deps.conductores.listarTodos();
    // ponytail: N+1 sobre asignaciones/vehículos; con decenas de conductores por municipio no duele.
    const resultado = await Promise.all(
      filas.map(async (f) => {
        const estados = new Map(f.docs.map((d) => [d.tipo as TipoDocumento, d.estado as EstadoDocumento]));
        // Un conductor tiene vehículos por dos vías: los PROPIOS (se registró como
        // propietario de su moto) y los ASIGNADOS por otro propietario. Unimos ambos.
        const propios = await deps.vehiculos.listarPorPropietario(f.idConductor);
        const idsAsignados = await deps.asignaciones.vehiculosAsignados(f.idConductor);
        const asignados = (await Promise.all(idsAsignados.map((id) => deps.vehiculos.findById(id))))
          .filter((v) => v != null);
        const porId = new Map([...propios, ...asignados].map((v) => [v.idVehiculo, v]));
        const vehiculos = [...porId.values()].map((v) => ({
          idVehiculo: v.idVehiculo,
          placa: v.placa,
          modelo: v.modelo,
          activo: v.idVehiculo === f.idVehiculoActivo,
        }));
        return {
          idConductor: f.idConductor,
          nombre: f.nombre,
          telefono: f.telefono,
          idMunicipio: f.idMunicipio,
          municipio: f.municipio,
          estadoVerificacion: calcularEstadoVerificacion(estados),
          estadoCuenta: f.estadoCuenta,
          vehiculos,
        };
      }),
    );
    return filtroEstado ? resultado.filter((c) => c.estadoVerificacion === filtroEstado) : resultado;
  };
}
