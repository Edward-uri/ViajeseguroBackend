import type { IDocumentoConductorRepository } from '../domain/repositories/IDocumentoConductorRepository.js';
import type { IDocumentStorage } from '../../core/storage.js';
import { DocumentoNoEncontradoError, NoEsTuDocumentoError } from '../domain/errors.js';

export function getArchivo(deps: {
  documentos: IDocumentoConductorRepository;
  storage: IDocumentStorage;
}) {
  return async (input: {
    idDocumento: number;
    solicitante: { idUsuario: number; esAdmin: boolean };
  }): Promise<{ contenido: Buffer; mimeType: string; nombreOriginal: string | null }> => {
    const doc = await deps.documentos.findById(input.idDocumento);
    if (!doc) throw new DocumentoNoEncontradoError();
    if (!input.solicitante.esAdmin && doc.idConductor !== input.solicitante.idUsuario) {
      throw new NoEsTuDocumentoError();
    }
    const contenido = await deps.storage.leer(doc.archivoKey);
    return { contenido, mimeType: doc.mimeType, nombreOriginal: doc.nombreOriginal };
  };
}
