import type { DocumentoConductor } from '../DocumentoConductor.js';
import type { TipoDocumento, EstadoDocumento } from '../tipos.js';

export interface IDocumentoConductorRepository {
  upsert(args: {
    idConductor: number;
    tipo: TipoDocumento;
    archivoKey: string;
    nombreOriginal: string | null;
    mimeType: string;
    tamanoBytes: number;
  }): Promise<DocumentoConductor>;
  listarPorConductor(idConductor: number): Promise<DocumentoConductor[]>;
  findById(idDocumento: number): Promise<DocumentoConductor | null>;
  revisar(args: {
    idDocumento: number;
    estado: EstadoDocumento;
    motivoRechazo: string | null;
    revisadoPor: number;
  }): Promise<DocumentoConductor>;
}
