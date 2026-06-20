import { pool } from '../../core/db.js';
import type { IDispositivoRepository } from '../domain/repositories/IDispositivoRepository.js';

export class DispositivoPostgresRepository implements IDispositivoRepository {
  async upsert({ idUsuario, tokenFcm, plataforma }: { idUsuario: number; tokenFcm: string; plataforma: 'android' | 'ios' }): Promise<void> {
    await pool.query(
      `INSERT INTO dispositivos (id_usuario, token_fcm, plataforma, activo)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (token_fcm)
       DO UPDATE SET id_usuario = EXCLUDED.id_usuario, plataforma = EXCLUDED.plataforma, activo = TRUE`,
      [idUsuario, tokenFcm, plataforma],
    );
  }
}
