import type { IPushSender } from '../domain/ports/IPushSender.js';

export class LogPushSender implements IPushSender {
  async enviar(args: { idUsuario: number; titulo: string; cuerpo: string; data?: Record<string, string> }): Promise<void> {
    console.log(`[push] -> usuario ${args.idUsuario}: ${args.titulo}`);
  }
}
