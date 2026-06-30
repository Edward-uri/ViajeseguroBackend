export interface IAutorizacionVehiculo {
  existeVehiculo(idVehiculo: number): Promise<boolean>;
  conductorAutorizado(idConductor: number, idVehiculo: number): Promise<boolean>;
  /** El vehículo tiene sus documentos requeridos aprobados por un admin. */
  vehiculoAprobado(idVehiculo: number): Promise<boolean>;
}
