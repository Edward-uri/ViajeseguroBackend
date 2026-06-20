import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import type { IDocumentStorage } from '../../core/storage.js';
import { DocumentoNoEncontradoError, NoEsTuVehiculoError } from '../domain/errors.js';

export function getArchivoVehiculo(deps: {
  vehiculos: IVehiculoRepository;
  documentos: IDocumentoVehiculoRepository;
  storage: IDocumentStorage;
}) {
  return async (input: {
    idDocumento: number;
    solicitante: { idUsuario: number; esAdmin: boolean };
  }): Promise<{ contenido: Buffer; mimeType: string; nombreOriginal: string | null }> => {
    const doc = await deps.documentos.findById(input.idDocumento);
    if (!doc) throw new DocumentoNoEncontradoError();

    if (!input.solicitante.esAdmin) {
      const vehiculo = await deps.vehiculos.findById(doc.idVehiculo);
      if (!vehiculo || vehiculo.idPropietario !== input.solicitante.idUsuario) {
        throw new NoEsTuVehiculoError();
      }
    }

    const contenido = await deps.storage.leer(doc.archivoKey);
    return { contenido, mimeType: doc.mimeType, nombreOriginal: doc.nombreOriginal };
  };
}
