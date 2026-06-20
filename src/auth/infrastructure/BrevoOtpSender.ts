import { env } from '../../core/env.js';
import { TTL_MINUTOS } from '../domain/otp.js';
import type { IOtpSender } from '../domain/IOtpSender.js';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export class BrevoOtpSender implements IOtpSender {
  async enviar({ destino, codigo }: { destino: string; canal: 'sms' | 'email'; codigo: string }): Promise<void> {
    if (!env.BREVO_API_KEY) throw new Error('BREVO_API_KEY no configurada');

    // Si hay BREVO_TEMPLATE_ID, usa la plantilla alojada en Brevo (sender/subject vienen de ahí).
    // Si no, manda un HTML mínimo inline como fallback.
    const payload = env.BREVO_TEMPLATE_ID
      ? {
          templateId: env.BREVO_TEMPLATE_ID,
          to: [{ email: destino }],
          params: { CODE: codigo, EXPIRY_MINUTES: TTL_MINUTOS },
        }
      : {
          sender: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
          to: [{ email: destino }],
          subject: 'Tu código de verificación',
          htmlContent: `<p>Tu código de Jala es:</p><h2 style="letter-spacing:4px">${codigo}</h2><p>Vence en ${TTL_MINUTOS} minutos.</p>`,
        };

    const res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detalle = await res.text().catch(() => '');
      throw new Error(`Brevo respondió ${res.status}: ${detalle}`);
    }
  }
}
