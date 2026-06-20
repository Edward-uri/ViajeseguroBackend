import { randomUUID } from 'node:crypto';
import type { IConductorRepository } from '../domain/repositories/IConductorRepository.js';
import type { IDocumentoConductorRepository } from '../domain/repositories/IDocumentoConductorRepository.js';
import type { IDocumentStorage } from '../../core/storage.js';
import { MIME_PERMITIDOS } from '../../core/storage.js';
import type { DocumentoConductor } from '../domain/DocumentoConductor.js';
import { type TipoDocumento } from '../domain/tipos.js';
import { ArchivoRequeridoError } from '../domain/errors.js';

export function uploadDocumento(deps: {
  conductores: IConductorRepository;
  documentos: IDocumentoConductorRepository;
  storage: IDocumentStorage;
}) {
  return async (input: {
    idConductor: number;
    tipo: TipoDocumento;
    contenido: Buffer;
    mimeType: string;
    nombreOriginal: string | null;
  }): Promise<DocumentoConductor> => {
    const ext = MIME_PERMITIDOS[input.mimeType];
    if (!ext || input.contenido.length === 0) throw new ArchivoRequeridoError();

    await deps.conductores.asegurarExiste(input.idConductor);

    const previos = await deps.documentos.listarPorConductor(input.idConductor);
    const previo = previos.find((d) => d.tipo === input.tipo);

    const key = `conductores/${input.idConductor}/${input.tipo}-${randomUUID()}${ext}`;
    await deps.storage.guardar({ key, contenido: input.contenido });

    const doc = await deps.documentos.upsert({
      idConductor: input.idConductor,
      tipo: input.tipo,
      archivoKey: key,
      nombreOriginal: input.nombreOriginal,
      mimeType: input.mimeType,
      tamanoBytes: input.contenido.length,
    });

    if (previo && previo.archivoKey !== key) {
      try { await deps.storage.borrar(previo.archivoKey); } catch { /* archivo huérfano: no crítico */ }
    }
    return doc;
  };
}
