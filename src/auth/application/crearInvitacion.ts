import type { IUserRepository } from '../../users/domain/repositories/IUserRepository.js';
import type { IInvitacionRepository } from '../domain/repositories/IInvitacionRepository.js';
import type { IInvitationSender } from '../domain/IInvitationSender.js';
import { env } from '../../core/env.js';
import { CorreoYaRegistradoError } from '../domain/errors.js';
import { generarToken, hashToken } from '../domain/inviteToken.js';

export function crearInvitacion(deps: {
  users: IUserRepository;
  invitaciones: IInvitacionRepository;
  sender: IInvitationSender;
}) {
  return async ({ correo, invitadoPor, invitadorCorreo }:
    { correo: string; invitadoPor: number; invitadorCorreo: string }) => {
    const existente = await deps.users.findByCorreo(correo);
    if (existente) throw new CorreoYaRegistradoError();

    const token = generarToken();
    const tokenHash = hashToken(token);
    const expiraEn = new Date(Date.now() + env.INVITE_TTL_DAYS * 86_400_000);

    const inv = await deps.invitaciones.upsertPendiente({ correo, tokenHash, invitadoPor, expiraEn });

    const aceptarUrl = `${env.ADMIN_PANEL_URL}/aceptar-invitacion?token=${token}`;
    await deps.sender.enviar({
      destino: correo, aceptarUrl, expiraDias: env.INVITE_TTL_DAYS, invitadorCorreo,
    });

    return { idInvitacion: inv.idInvitacion, correo: inv.correo, estado: inv.estado, expiraEn: inv.expiraEn };
  };
}
