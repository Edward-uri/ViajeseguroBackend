export interface IAutorizacionVehiculo {
  existeVehiculo(idVehiculo: number): Promise<boolean>;
  conductorAutorizado(idConductor: number, idVehiculo: number): Promise<boolean>;
}
