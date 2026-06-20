import type { IPushSender } from '../domain/ports/IPushSender.js';

export class MockPushSender implements IPushSender {
  async enviar(args: { idUsuario: number; titulo: string; cuerpo: string; data?: Record<string, string> }): Promise<void> {
    console.log(`[push mock] -> usuario ${args.idUsuario}: ${args.titulo}`);
  }
}
