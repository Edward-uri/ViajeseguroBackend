import { randomUUID } from 'node:crypto';
import type { IVehiculoRepository } from '../domain/repositories/IVehiculoRepository.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import type { IDocumentStorage } from '../../core/storage.js';
import { MIME_PERMITIDOS } from '../../core/storage.js';
import type { DocumentoVehiculo } from '../domain/DocumentoVehiculo.js';
import type { TipoDocumentoVehiculo } from '../domain/tipos.js';
import { ArchivoRequeridoError, VehiculoNoEncontradoError, NoEsTuVehiculoError } from '../domain/errors.js';

export function uploadDocumentoVehiculo(deps: {
  vehiculos: IVehiculoRepository;
  documentos: IDocumentoVehiculoRepository;
  storage: IDocumentStorage;
}) {
  return async (input: {
    idVehiculo: number;
    idPropietario: number;
    tipo: TipoDocumentoVehiculo;
    contenido: Buffer;
    mimeType: string;
    nombreOriginal: string | null;
  }): Promise<DocumentoVehiculo> => {
    const ext = MIME_PERMITIDOS[input.mimeType];
    if (!ext || input.contenido.length === 0) throw new ArchivoRequeridoError();

    const vehiculo = await deps.vehiculos.findById(input.idVehiculo);
    if (!vehiculo) throw new VehiculoNoEncontradoError();
    if (vehiculo.idPropietario !== input.idPropietario) throw new NoEsTuVehiculoError();

    const previos = await deps.documentos.listarPorVehiculo(input.idVehiculo);
    const previo = previos.find((d) => d.tipo === input.tipo);

    const key = `vehiculos/${input.idVehiculo}/${input.tipo}-${randomUUID()}${ext}`;
    await deps.storage.guardar({ key, contenido: input.contenido });

    const doc = await deps.documentos.upsert({
      idVehiculo: input.idVehiculo,
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
