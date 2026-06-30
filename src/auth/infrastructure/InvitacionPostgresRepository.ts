import { pool } from '../../core/db.js';
import type { PoolClient } from 'pg';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';
import type {
  IInvitacionRepository, InvitacionRow, EstadoInvitacion,
} from '../domain/repositories/IInvitacionRepository.js';

interface Row {
  id_invitacion: string | number;
  correo: string | null;
  token_hash: string;
  invitado_por: string | number;
  estado: EstadoInvitacion;
  expira_en: Date;
  aceptada_en: Date | null;
  created_at: Date;
}

function mapRow(r: Row): InvitacionRow {
  const dec = cipherCodec.decodeDeRow('invitaciones_admin', r as unknown as Record<string, unknown>);
  return {
    idInvitacion: Number(r.id_invitacion),
    correo: ((dec.correo as string | null) ?? r.correo) as string,
    tokenHash: r.token_hash,
    invitadoPor: Number(r.invitado_por),
    estado: r.estado,
    expiraEn: r.expira_en,
    aceptadaEn: r.aceptada_en,
    createdAt: r.created_at,
  };
}

export class InvitacionPostgresRepository implements IInvitacionRepository {
  async pendientePorCorreo(correo: string): Promise<InvitacionRow | null> {
    const bidx = cipherCodec.bidx('invitaciones_admin', 'correo', correo);
    let { rows } = await pool.query<Row>(
      `SELECT * FROM invitaciones_admin WHERE correo_bidx = $1 AND estado = 'pendiente' LIMIT 1`,
      [bidx],
    );
    if (!rows[0]) {
      ({ rows } = await pool.query<Row>(
        `SELECT * FROM invitaciones_admin WHERE correo = $1 AND estado = 'pendiente' LIMIT 1`,
        [correo],
      ));
    }
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async upsertPendiente(
    { correo, tokenHash, invitadoPor, expiraEn }:
    { correo: string; tokenHash: string; invitadoPor: number; expiraEn: Date },
  ): Promise<InvitacionRow> {
    const existente = await this.pendientePorCorreo(correo);
    if (existente) {
      const { rows } = await pool.query<Row>(
        `UPDATE invitaciones_admin
            SET token_hash = $2, invitado_por = $3, expira_en = $4
          WHERE id_invitacion = $1 RETURNING *`,
        [existente.idInvitacion, tokenHash, invitadoPor, expiraEn],
      );
      return mapRow(rows[0]!);
    }
    const enc = cipherCodec.encodeParaInsert('invitaciones_admin', { correo });
    const { rows } = await pool.query<Row>(
      `INSERT INTO invitaciones_admin (correo_enc, correo_bidx, token_hash, invitado_por, expira_en)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [enc.correo_enc, enc.correo_bidx, tokenHash, invitadoPor, expiraEn],
    );
    return mapRow(rows[0]!);
  }

  async porTokenHashVigente(tokenHash: string): Promise<InvitacionRow | null> {
    const { rows } = await pool.query<Row>(
      `SELECT * FROM invitaciones_admin
        WHERE token_hash = $1 AND estado = 'pendiente' AND expira_en > NOW() LIMIT 1`,
      [tokenHash],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async marcarAceptada(idInvitacion: number, client?: PoolClient): Promise<void> {
    const q = `UPDATE invitaciones_admin
                  SET estado = 'aceptada', aceptada_en = NOW()
                WHERE id_invitacion = $1`;
    if (client) await client.query(q, [idInvitacion]);
    else await pool.query(q, [idInvitacion]);
  }

  async listar(): Promise<InvitacionRow[]> {
    const { rows } = await pool.query<Row>(
      `SELECT * FROM invitaciones_admin ORDER BY created_at DESC`,
    );
    return rows.map(mapRow);
  }

  async porId(idInvitacion: number): Promise<InvitacionRow | null> {
    const { rows } = await pool.query<Row>(
      `SELECT * FROM invitaciones_admin WHERE id_invitacion = $1 LIMIT 1`,
      [idInvitacion],
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async revocar(idInvitacion: number): Promise<void> {
    await pool.query(
      `UPDATE invitaciones_admin SET estado = 'revocada' WHERE id_invitacion = $1`,
      [idInvitacion],
    );
  }
}
