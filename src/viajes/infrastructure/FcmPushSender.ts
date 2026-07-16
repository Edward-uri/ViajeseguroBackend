import { initializeApp, cert, getApps, type App, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import type { IPushSender } from '../domain/ports/IPushSender.js';
import type { IDispositivoRepository } from '../domain/repositories/IDispositivoRepository.js';
import { pool } from '../../core/db.js';

const CODIGOS_TOKEN_INVALIDO = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);
export const esTokenInvalido = (code?: string): boolean =>
  code != null && CODIGOS_TOKEN_INVALIDO.has(code);

export class FcmPushSender implements IPushSender {
  private app: App | null = null;

  constructor(
    private readonly dispositivos: IDispositivoRepository,
    private readonly serviceAccountBase64: string,
  ) {}

  private messaging(): Messaging {
    if (!this.app) {
      const existing = getApps().find((a) => a.name === 'fcm-jala');
      if (existing) {
        this.app = existing;
      } else {
        const json = JSON.parse(Buffer.from(this.serviceAccountBase64, 'base64').toString('utf8')) as ServiceAccount;
        this.app = initializeApp({ credential: cert(json) }, 'fcm-jala');
      }
    }
    return getMessaging(this.app);
  }

  async enviar(args: { idUsuario: number; titulo: string; cuerpo: string; data?: Record<string, string> }): Promise<void> {
    const tokens = await this.dispositivos.tokensActivosDeUsuario(args.idUsuario);
    if (tokens.length === 0) return;
    try {
      const res = await this.messaging().sendEachForMulticast({
        tokens,
        notification: { title: args.titulo, body: args.cuerpo },
        data: args.data,
      });
      await Promise.all(
        res.responses.map(async (r, i) => {
          const token = tokens[i]!;
          if (r.success) return this.log(args, token, 'enviado', null);
          const code = r.error?.code;
          if (esTokenInvalido(code)) {
            await this.dispositivos.desactivarToken(token);
            return this.log(args, token, 'token_invalido', code ?? null);
          }
          return this.log(args, token, 'fallido', `${code ?? ''} ${r.error?.message ?? ''}`.trim().slice(0, 500));
        }),
      );
    } catch (e) {
      console.error('[FCM] error enviando push', e);
    }
  }

  /** Auditoría en log_notificaciones; un fallo aquí no debe tumbar el envío. */
  private async log(
    args: { idUsuario: number; titulo: string; data?: Record<string, string> },
    tokenFcm: string,
    estado: 'enviado' | 'fallido' | 'token_invalido',
    errorDetalle: string | null,
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO log_notificaciones (id_usuario, token_fcm, titulo, estado, error_detalle, contexto)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [args.idUsuario, tokenFcm, args.titulo, estado, errorDetalle, args.data ?? null],
      );
    } catch (e) {
      console.error('[FCM] no se pudo registrar en log_notificaciones', e);
    }
  }
}
