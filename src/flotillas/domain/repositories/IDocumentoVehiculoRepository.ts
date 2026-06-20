import type { DocumentoVehiculo } from '../DocumentoVehiculo.js';
import type { TipoDocumentoVehiculo, EstadoDocumento } from '../tipos.js';

export interface IDocumentoVehiculoRepository {
  upsert(args: {
    idVehiculo: number;
    tipo: TipoDocumentoVehiculo;
    archivoKey: string;
    nombreOriginal: string | null;
    mimeType: string;
    tamanoBytes: number;
  }): Promise<DocumentoVehiculo>;
  listarPorVehiculo(idVehiculo: number): Promise<DocumentoVehiculo[]>;
  findById(idDocumento: number): Promise<DocumentoVehiculo | null>;
  revisar(args: {
    idDocumento: number;
    estado: EstadoDocumento;
    motivoRechazo: string | null;
    revisadoPor: number;
  }): Promise<DocumentoVehiculo>;
}
