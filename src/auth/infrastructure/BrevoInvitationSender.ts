import { env } from '../../core/env.js';
import type { IInvitationSender, InvitationArgs } from '../domain/IInvitationSender.js';

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export class BrevoInvitationSender implements IInvitationSender {
  async enviar({ destino, aceptarUrl, expiraDias, invitadorCorreo }: InvitationArgs): Promise<void> {
    if (!env.BREVO_API_KEY) throw new Error('BREVO_API_KEY no configurada');
    if (!env.BREVO_INVITE_TEMPLATE_ID) throw new Error('BREVO_INVITE_TEMPLATE_ID no configurada');

    const payload = {
      templateId: env.BREVO_INVITE_TEMPLATE_ID,
      to: [{ email: destino }],
      params: { ACCEPT_URL: aceptarUrl, EXPIRY_DAYS: expiraDias, INVITER_EMAIL: invitadorCorreo },
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
