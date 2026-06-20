import type { IOtpSender } from '../domain/IOtpSender.js';

export let ultimoCodigoEnviado: string | undefined;

export class MockOtpSender implements IOtpSender {
  async enviar({ destino, canal, codigo }: { destino: string; canal: 'sms' | 'email'; codigo: string }): Promise<void> {
    ultimoCodigoEnviado = codigo;
    console.log(`[OTP MOCK] (${canal}) -> ${destino}: ${codigo}`);
  }
}
