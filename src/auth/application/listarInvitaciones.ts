import type { IInvitacionRepository } from '../domain/repositories/IInvitacionRepository.js';

export function listarInvitaciones(deps: { invitaciones: IInvitacionRepository }) {
  return async () => {
    const filas = await deps.invitaciones.listar();
    const ahora = Date.now();
    return filas.map((f) => ({
      idInvitacion: f.idInvitacion,
      correo: f.correo,
      estado: f.estado === 'pendiente' && f.expiraEn.getTime() < ahora ? 'expirada' : f.estado,
      expiraEn: f.expiraEn,
      invitadoPor: f.invitadoPor,
      createdAt: f.createdAt,
    }));
  };
}
