export interface ISessionRepository {
  crear(args: {
    idUsuario: number;
    refreshHash: string;
    dispositivo: string | null;
    expiraEn: Date;
  }): Promise<{ idSesion: number }>;
  actualizarHash(idSesion: number, refreshHash: string): Promise<void>;
  buscarVigente(
    idSesion: number,
  ): Promise<{ idSesion: number; idUsuario: number; refreshHash: string } | null>;
  revocar(idSesion: number): Promise<void>;
  revocarTodasDeUsuario(idUsuario: number): Promise<void>;
}
