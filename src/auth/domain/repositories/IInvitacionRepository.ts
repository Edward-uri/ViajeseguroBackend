import type { PoolClient } from 'pg';

export type EstadoInvitacion = 'pendiente' | 'aceptada' | 'revocada';

export interface InvitacionRow {
  idInvitacion: number;
  correo: string;
  tokenHash: string;
  invitadoPor: number;
  estado: EstadoInvitacion;
  expiraEn: Date;
  aceptadaEn: Date | null;
  createdAt: Date;
}

export interface IInvitacionRepository {
  pendientePorCorreo(correo: string): Promise<InvitacionRow | null>;
  upsertPendiente(args: {
    correo: string; tokenHash: string; invitadoPor: number; expiraEn: Date;
  }): Promise<InvitacionRow>;
  porTokenHashVigente(tokenHash: string): Promise<InvitacionRow | null>; // pendiente + expira_en > now()
  marcarAceptada(idInvitacion: number, client?: PoolClient): Promise<void>;
  listar(): Promise<InvitacionRow[]>;
  porId(idInvitacion: number): Promise<InvitacionRow | null>;
  revocar(idInvitacion: number): Promise<void>;
}
