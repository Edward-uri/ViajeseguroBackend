import type { IInvitationSender, InvitationArgs } from '../domain/IInvitationSender.js';

/** Última invitación enviada. Los tests la leen vía `import * as mock` (igual que ultimoCodigoEnviado). */
export let ultimaInvitacion: InvitationArgs | undefined;

export class MockInvitationSender implements IInvitationSender {
  async enviar(args: InvitationArgs): Promise<void> {
    ultimaInvitacion = args;
    console.log(`[INVITE MOCK] -> ${args.destino}: ${args.aceptarUrl}`);
  }
}
