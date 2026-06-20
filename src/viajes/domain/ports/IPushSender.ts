export interface IPushSender {
  enviar(args: { idUsuario: number; titulo: string; cuerpo: string; data?: Record<string, string> }): Promise<void>;
}
