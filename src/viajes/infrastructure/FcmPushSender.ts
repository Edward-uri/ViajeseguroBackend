import { initializeApp, cert, getApps, type App, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import type { IPushSender } from '../domain/ports/IPushSender.js';
import type { IDispositivoRepository } from '../domain/repositories/IDispositivoRepository.js';

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
      await this.messaging().sendEachForMulticast({
        tokens,
        notification: { title: args.titulo, body: args.cuerpo },
        data: args.data,
      });
    } catch (e) {
      console.error('[FCM] error enviando push', e);
    }
  }
}
