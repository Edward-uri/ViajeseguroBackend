import { pool } from '../../core/db.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';
import type { Direccion, CrearDireccionInput, IDireccionRepository } from '../domain/repositories/IDireccionRepository.js';

interface Row {
  id_direccion: string | number;
  etiqueta: string | null;
  lat: string | null; lat_enc: string | null;
  lng: string | null; lng_enc: string | null;
  texto: string | null; texto_enc: string | null;
  es_favorita: boolean;
}

function mapRow(row: Row): Direccion {
  const d = cipherCodec.decodeDeRow('direcciones_usuario', row as unknown as Record<string, unknown>);
  const num = (dec: unknown, plano: string | null) =>
    (dec ?? plano) == null ? null : Number(dec ?? plano);
  return {
    idDireccion: Number(row.id_direccion),
    etiqueta: row.etiqueta,
    lat: num(d.lat, row.lat),
    lng: num(d.lng, row.lng),
    texto: (d.texto as string | null) ?? row.texto,
    esFavorita: row.es_favorita,
  };
}

export class DireccionPostgresRepository implements IDireccionRepository {
  async listar(idUsuario: number): Promise<Direccion[]> {
    const { rows } = await pool.query<Row>(
      `SELECT * FROM direcciones_usuario WHERE id_usuario = $1
        ORDER BY es_favorita DESC, created_at DESC`,
      [idUsuario],
    );
    return rows.map(mapRow);
  }

  async crear(idUsuario: number, input: CrearDireccionInput): Promise<Direccion> {
    const enc = cipherCodec.encodeParaInsert('direcciones_usuario', {
      lat: input.lat, lng: input.lng, texto: input.texto,
    });
    const { rows } = await pool.query<Row>(
      `INSERT INTO direcciones_usuario (id_usuario, etiqueta, lat_enc, lng_enc, texto_enc, es_favorita)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [idUsuario, input.etiqueta, enc.lat_enc, enc.lng_enc, enc.texto_enc, input.esFavorita],
    );
    return mapRow(rows[0]!);
  }

  async eliminar(idUsuario: number, idDireccion: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'DELETE FROM direcciones_usuario WHERE id_direccion = $1 AND id_usuario = $2',
      [idDireccion, idUsuario],
    );
    return (rowCount ?? 0) > 0;
  }
}
