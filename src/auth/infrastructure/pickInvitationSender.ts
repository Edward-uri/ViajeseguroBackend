import { env } from '../../core/env.js';
import type { IInvitationSender } from '../domain/IInvitationSender.js';
import { BrevoInvitationSender } from './BrevoInvitationSender.js';
import { MockInvitationSender } from './MockInvitationSender.js';

export function pickInvitationSender(): IInvitationSender {
  // En tests SIEMPRE el mock para leer el token del aceptarUrl (espejo de dependencies.ts de auth).
  if (env.NODE_ENV !== 'test' && env.BREVO_API_KEY && env.BREVO_INVITE_TEMPLATE_ID) {
    return new BrevoInvitationSender();
  }
  return new MockInvitationSender();
}
