import { pool } from '../../core/db.js';
import type { ISessionRepository } from '../domain/repositories/ISessionRepository.js';

export class SessionPostgresRepository implements ISessionRepository {
  async crear(a: Parameters<ISessionRepository['crear']>[0]): Promise<{ idSesion: number }> {
    const { rows } = await pool.query<{ id_sesion: string | number }>(
      `INSERT INTO sesiones (id_usuario, refresh_hash, dispositivo, expira_en)
       VALUES ($1, $2, $3, $4) RETURNING id_sesion`,
      [a.idUsuario, a.refreshHash, a.dispositivo, a.expiraEn],
    );
    return { idSesion: Number(rows[0]!.id_sesion) };
  }

  async actualizarHash(idSesion: number, refreshHash: string): Promise<void> {
    await pool.query('UPDATE sesiones SET refresh_hash = $2 WHERE id_sesion = $1', [idSesion, refreshHash]);
  }

  async buscarVigente(
    idSesion: number,
  ): Promise<{ idSesion: number; idUsuario: number; refreshHash: string } | null> {
    const { rows } = await pool.query<{ id_sesion: string | number; id_usuario: string | number; refresh_hash: string }>(
      `SELECT id_sesion, id_usuario, refresh_hash FROM sesiones
        WHERE id_sesion = $1 AND revocada_en IS NULL AND expira_en > NOW()`,
      [idSesion],
    );
    if (!rows[0]) return null;
    return {
      idSesion: Number(rows[0].id_sesion),
      idUsuario: Number(rows[0].id_usuario),
      refreshHash: rows[0].refresh_hash,
    };
  }

  async revocar(idSesion: number): Promise<void> {
    await pool.query('UPDATE sesiones SET revocada_en = NOW() WHERE id_sesion = $1', [idSesion]);
  }

  async revocarTodasDeUsuario(idUsuario: number): Promise<void> {
    await pool.query(
      'UPDATE sesiones SET revocada_en = NOW() WHERE id_usuario = $1 AND revocada_en IS NULL',
      [idUsuario],
    );
  }
}
