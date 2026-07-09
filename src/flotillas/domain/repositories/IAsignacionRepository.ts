export interface IAsignacionRepository {
  asignar(
    args: { idVehiculo: number; idConductor: number; origen?: 'propia' | 'bolsa' },
    client?: import('pg').PoolClient,
  ): Promise<void>;
  revocar(args: { idVehiculo: number; idConductor: number }): Promise<boolean>;
  listarConductoresPorVehiculo(idVehiculo: number): Promise<number[]>;
  vehiculosAsignados(idConductor: number): Promise<number[]>;
  conductorAutorizado(idConductor: number, idVehiculo: number): Promise<boolean>;
  existeConductor(idConductor: number): Promise<boolean>;
}
