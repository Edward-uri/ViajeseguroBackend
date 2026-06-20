import { pool } from '../../core/db.js';
import { DocumentoVehiculo, DocumentoVehiculoBuilder } from '../domain/DocumentoVehiculo.js';
import type { IDocumentoVehiculoRepository } from '../domain/repositories/IDocumentoVehiculoRepository.js';
import type { TipoDocumentoVehiculo, EstadoDocumento } from '../domain/tipos.js';

interface Row {
  id_documento: string | number;
  id_vehiculo: string | number;
  tipo: TipoDocumentoVehiculo;
  archivo_key: string;
  nombre_original: string | null;
  mime_type: string;
  tamano_bytes: number;
  estado: EstadoDocumento;
  motivo_rechazo: string | null;
  revisado_por: string | number | null;
  revisado_en: Date | null;
}

function map(row: Row): DocumentoVehiculo {
  return new DocumentoVehiculoBuilder()
    .idDocumento(Number(row.id_documento))
    .idVehiculo(Number(row.id_vehiculo))
    .tipo(row.tipo)
    .archivoKey(row.archivo_key)
    .nombreOriginal(row.nombre_original)
    .mimeType(row.mime_type)
    .tamanoBytes(row.tamano_bytes)
    .estado(row.estado)
    .motivoRechazo(row.motivo_rechazo)
    .revisadoPor(row.revisado_por === null ? null : Number(row.revisado_por))
    .revisadoEn(row.revisado_en)
    .build();
}

export class DocumentoVehiculoPostgresRepository implements IDocumentoVehiculoRepository {
  async upsert(a: {
    idVehiculo: number; tipo: TipoDocumentoVehiculo; archivoKey: string;
    nombreOriginal: string | null; mimeType: string; tamanoBytes: number;
  }): Promise<DocumentoVehiculo> {
    const { rows } = await pool.query<Row>(
      `INSERT INTO documentos_vehiculo
         (id_vehiculo, tipo, archivo_key, nombre_original, mime_type, tamano_bytes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id_vehiculo, tipo) DO UPDATE SET
         archivo_key = EXCLUDED.archivo_key,
         nombre_original = EXCLUDED.nombre_original,
         mime_type = EXCLUDED.mime_type,
         tamano_bytes = EXCLUDED.tamano_bytes,
         estado = 'pendiente',
         motivo_rechazo = NULL,
         revisado_por = NULL,
         revisado_en = NULL
       RETURNING *`,
      [a.idVehiculo, a.tipo, a.archivoKey, a.nombreOriginal, a.mimeType, a.tamanoBytes],
    );
    return map(rows[0]!);
  }

  async listarPorVehiculo(idVehiculo: number): Promise<DocumentoVehiculo[]> {
    const { rows } = await pool.query<Row>(
      'SELECT * FROM documentos_vehiculo WHERE id_vehiculo = $1 ORDER BY tipo',
      [idVehiculo],
    );
    return rows.map(map);
  }

  async findById(idDocumento: number): Promise<DocumentoVehiculo | null> {
    const { rows } = await pool.query<Row>('SELECT * FROM documentos_vehiculo WHERE id_documento = $1', [idDocumento]);
    return rows[0] ? map(rows[0]) : null;
  }

  async revisar(a: {
    idDocumento: number; estado: EstadoDocumento; motivoRechazo: string | null; revisadoPor: number;
  }): Promise<DocumentoVehiculo> {
    const { rows } = await pool.query<Row>(
      `UPDATE documentos_vehiculo
          SET estado = $2, motivo_rechazo = $3, revisado_por = $4, revisado_en = NOW()
        WHERE id_documento = $1
        RETURNING *`,
      [a.idDocumento, a.estado, a.motivoRechazo, a.revisadoPor],
    );
    return map(rows[0]!);
  }
}
