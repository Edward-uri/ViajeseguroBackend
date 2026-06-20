export interface IDispositivoRepository {
  upsert(args: { idUsuario: number; tokenFcm: string; plataforma: 'android' | 'ios' }): Promise<void>;
  tokensActivosDeUsuario(idUsuario: number): Promise<string[]>;
}
