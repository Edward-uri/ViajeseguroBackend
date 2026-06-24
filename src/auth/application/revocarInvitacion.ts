import type { IInvitacionRepository } from '../domain/repositories/IInvitacionRepository.js';
import { InvitacionNoEncontradaError, InvitacionYaAceptadaError } from '../domain/errors.js';

export function revocarInvitacion(deps: { invitaciones: IInvitacionRepository }) {
  return async (idInvitacion: number) => {
    const inv = await deps.invitaciones.porId(idInvitacion);
    if (!inv) throw new InvitacionNoEncontradaError();
    if (inv.estado === 'aceptada') throw new InvitacionYaAceptadaError();
    if (inv.estado === 'pendiente') await deps.invitaciones.revocar(idInvitacion);
    // 'revocada' → no-op → 204
  };
}
