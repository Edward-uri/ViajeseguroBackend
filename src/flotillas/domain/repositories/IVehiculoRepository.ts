import type { Vehiculo } from '../Vehiculo.js';

export interface VehiculoPendiente {
  idVehiculo: number;
  placa: string;
  propietario: string;
  telefono: string;
  documentosPendientes: number;
}

export interface IVehiculoRepository {
  crear(args: {
    idPropietario: number;
    placa: string;
    modelo: string | null;
    color: string | null;
    anio: number | null;
    idMunicipio: number;
  }): Promise<Vehiculo>;
  findById(idVehiculo: number): Promise<Vehiculo | null>;
  listarPorPropietario(idPropietario: number): Promise<Vehiculo[]>;
  actualizar(args: {
    idVehiculo: number;
    modelo: string | null;
    color: string | null;
    anio: number | null;
    idMunicipio: number;
  }): Promise<Vehiculo>;
  registrarCambioEstatus(args: { idVehiculo: number; estatus: 'activo' | 'inactivo'; descripcion: string | null }): Promise<void>;
  listarConPendientes(): Promise<VehiculoPendiente[]>;
}
