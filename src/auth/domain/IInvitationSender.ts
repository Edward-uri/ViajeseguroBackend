export interface InvitationArgs {
  destino: string;
  aceptarUrl: string;   // incluye el token en claro
  expiraDias: number;
  invitadorCorreo: string;
}
export interface IInvitationSender {
  enviar(args: InvitationArgs): Promise<void>;
}
