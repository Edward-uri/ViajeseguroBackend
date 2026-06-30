import { pool } from '../../core/db.js';
import { cipherCodec } from '../../infrastructure/crypto/cipher.js';
import type { IOtpRepository, OtpRow } from '../domain/repositories/IOtpRepository.js';

interface Row {
  id_codigo: string | number;
  id_usuario: string | number | null;
  destino: string | null;
  canal: 'sms' | 'email';
  proposito: 'registro' | 'login';
  codigo_hash: string;
  expira_en: Date;
  intentos: number;
  usado_en: Date | null;
}

function map(r: Row): OtpRow {
  const dec = cipherCodec.decodeDeRow('codigos_otp', r as unknown as Record<string, unknown>);
  return {
    idCodigo: Number(r.id_codigo),
    idUsuario: r.id_usuario === null ? null : Number(r.id_usuario),
    destino: ((dec.destino as string | null) ?? r.destino) as string,
    canal: r.canal,
    proposito: r.proposito,
    codigoHash: r.codigo_hash,
    expiraEn: r.expira_en,
    intentos: r.intentos,
    usadoEn: r.usado_en,
  };
}

export class OtpPostgresRepository implements IOtpRepository {
  async crear(a: Parameters<IOtpRepository['crear']>[0]): Promise<OtpRow> {
    const enc = cipherCodec.encodeParaInsert('codigos_otp', { destino: a.destino });
    const { rows } = await pool.query<Row>(
      `INSERT INTO codigos_otp (id_usuario, destino_enc, destino_bidx, canal, proposito, codigo_hash, expira_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [a.idUsuario, enc.destino_enc, enc.destino_bidx, a.canal, a.proposito, a.codigoHash, a.expiraEn],
    );
    return map(rows[0]!);
  }

  async ultimoVigente(destino: string, proposito: 'registro' | 'login'): Promise<OtpRow | null> {
    const bidx = cipherCodec.bidx('codigos_otp', 'destino', destino);
    let { rows } = await pool.query<Row>(
      `SELECT * FROM codigos_otp
        WHERE destino_bidx = $1 AND proposito = $2 AND usado_en IS NULL AND expira_en > NOW()
        ORDER BY id_codigo DESC LIMIT 1`,
      [bidx, proposito],
    );
    if (!rows[0]) {
      // Fallback transición: OTPs creados antes del cifrado (expiran pronto).
      ({ rows } = await pool.query<Row>(
        `SELECT * FROM codigos_otp
          WHERE destino = $1 AND proposito = $2 AND usado_en IS NULL AND expira_en > NOW()
          ORDER BY id_codigo DESC LIMIT 1`,
        [destino, proposito],
      ));
    }
    return rows[0] ? map(rows[0]) : null;
  }

  async incrementarIntentos(idCodigo: number): Promise<void> {
    await pool.query('UPDATE codigos_otp SET intentos = intentos + 1 WHERE id_codigo = $1', [idCodigo]);
  }

  async marcarUsado(idCodigo: number): Promise<void> {
    await pool.query('UPDATE codigos_otp SET usado_en = NOW() WHERE id_codigo = $1', [idCodigo]);
  }
}
