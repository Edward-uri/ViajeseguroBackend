import { pool } from '../../core/db.js';
import { DocumentoConductor, DocumentoConductorBuilder } from '../domain/DocumentoConductor.js';
import type { IDocumentoConductorRepository } from '../domain/repositories/IDocumentoConductorRepository.js';
import type { TipoDocumento, EstadoDocumento } from '../domain/tipos.js';

interface Row {
  id_documento: string | number;
  id_conductor: string | number;
  tipo: TipoDocumento;
  archivo_key: string;
  nombre_original: string | null;
  mime_type: string;
  tamano_bytes: number;
  estado: EstadoDocumento;
  motivo_rechazo: string | null;
  revisado_por: string | number | null;
  revisado_en: Date | null;
}

function map(row: Row): DocumentoConductor {
  return new DocumentoConductorBuilder()
    .idDocumento(Number(row.id_documento))
    .idConductor(Number(row.id_conductor))
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

export class DocumentoConductorPostgresRepository implements IDocumentoConductorRepository {
  async upsert(a: {
    idConductor: number; tipo: TipoDocumento; archivoKey: string;
    nombreOriginal: string | null; mimeType: string; tamanoBytes: number;
  }): Promise<DocumentoConductor> {
    const { rows } = await pool.query<Row>(
      `INSERT INTO documentos_conductor
         (id_conductor, tipo, archivo_key, nombre_original, mime_type, tamano_bytes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id_conductor, tipo) DO UPDATE SET
         archivo_key = EXCLUDED.archivo_key,
         nombre_original = EXCLUDED.nombre_original,
         mime_type = EXCLUDED.mime_type,
         tamano_bytes = EXCLUDED.tamano_bytes,
         estado = 'pendiente',
         motivo_rechazo = NULL,
         revisado_por = NULL,
         revisado_en = NULL
       RETURNING *`,
      [a.idConductor, a.tipo, a.archivoKey, a.nombreOriginal, a.mimeType, a.tamanoBytes],
    );
    return map(rows[0]!);
  }

  async listarPorConductor(idConductor: number): Promise<DocumentoConductor[]> {
    const { rows } = await pool.query<Row>(
      'SELECT * FROM documentos_conductor WHERE id_conductor = $1 ORDER BY tipo',
      [idConductor],
    );
    return rows.map(map);
  }

  async findById(idDocumento: number): Promise<DocumentoConductor | null> {
    const { rows } = await pool.query<Row>('SELECT * FROM documentos_conductor WHERE id_documento = $1', [idDocumento]);
    return rows[0] ? map(rows[0]) : null;
  }

  async revisar(a: {
    idDocumento: number; estado: EstadoDocumento; motivoRechazo: string | null; revisadoPor: number;
  }): Promise<DocumentoConductor> {
    const { rows } = await pool.query<Row>(
      `UPDATE documentos_conductor
          SET estado = $2, motivo_rechazo = $3, revisado_por = $4, revisado_en = NOW()
        WHERE id_documento = $1
        RETURNING *`,
      [a.idDocumento, a.estado, a.motivoRechazo, a.revisadoPor],
    );
    return map(rows[0]!);
  }
}
