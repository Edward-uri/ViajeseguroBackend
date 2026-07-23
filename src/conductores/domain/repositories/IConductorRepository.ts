import type { Conductor } from '../Conductor.js';

export interface ConductorPendiente {
  idConductor: number;
  nombre: string;
  telefono: string;
  documentosPendientes: number;
}

export interface IConductorRepository {
  asegurarExiste(idConductor: number): Promise<void>;
  findById(idConductor: number): Promise<Conductor | null>;
  municipioOperativo(idConductor: number): Promise<number | null>;
  upsertLicencia(args: {
    idConductor: number;
    idMunicipio: number;
    licencia: string;
    fechaExpedicion: string;
    fechaVencimiento: string;
  }): Promise<Conductor>;
  registrarCambioEstatus(args: {
    idConductor: number;
    estatus: 'habilitado' | 'inhabilitado';
    descripcion: string | null;
  }): Promise<void>;
  listarConPendientes(): Promise<ConductorPendiente[]>;
  /** Todos los conductores con sus documentos y vehículo activo (vista admin). */
  listarTodos(): Promise<{
    idConductor: number; nombre: string; telefono: string | null;
    idMunicipio: number | null; municipio: string | null; idVehiculoActivo: number | null;
    estadoCuenta: string; docs: { tipo: string; estado: string }[];
  }[]>;
  getVehiculoActivo(idConductor: number): Promise<number | null>;
  setVehiculoActivo(idConductor: number, idVehiculo: number | null): Promise<void>;
}
