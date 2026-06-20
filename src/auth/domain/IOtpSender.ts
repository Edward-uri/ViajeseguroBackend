export interface IOtpSender {
  enviar(args: { destino: string; canal: 'sms' | 'email'; codigo: string }): Promise<void>;
}
