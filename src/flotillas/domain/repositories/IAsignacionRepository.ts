import type { ConductorAsignado, TipoTurno } from '../ConductorAsignado.js';

export interface IAsignacionRepository {
  asignar(
    args: {
      idVehiculo: number; idConductor: number; origen?: 'propia' | 'bolsa';
      tipoTurno?: TipoTurno | null; rentaTurno?: number | null; dias?: string[] | null; horario?: string | null;
    },
    client?: import('pg').PoolClient,
  ): Promise<void>;
  actualizarTerminos(args: {
    idVehiculo: number; idConductor: number; tipoTurno: TipoTurno; rentaTurno: number; dias: string[]; horario: string | null;
  }): Promise<boolean>;
  revocar(args: { idVehiculo: number; idConductor: number }): Promise<boolean>;
  listarAsignacionesDeVehiculo(idVehiculo: number): Promise<ConductorAsignado[]>;
  /** Nº de conductores activos por vehículo (para marcar cuáles ya tienen conductor). */
  contarActivosPorVehiculos(ids: number[]): Promise<Record<number, number>>;
  vehiculosAsignados(idConductor: number): Promise<number[]>;
  conductorAutorizado(idConductor: number, idVehiculo: number): Promise<boolean>;
  existeConductor(idConductor: number): Promise<boolean>;
}
