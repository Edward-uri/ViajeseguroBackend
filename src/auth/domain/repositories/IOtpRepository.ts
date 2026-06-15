export interface OtpRow {
  idCodigo: number;
  idUsuario: number | null;
  destino: string;
  canal: 'sms' | 'email';
  proposito: 'registro' | 'login';
  codigoHash: string;
  expiraEn: Date;
  intentos: number;
  usadoEn: Date | null;
}

export interface IOtpRepository {
  crear(args: {
    idUsuario: number | null;
    destino: string;
    canal: 'sms' | 'email';
    proposito: 'registro' | 'login';
    codigoHash: string;
    expiraEn: Date;
  }): Promise<OtpRow>;
  ultimoVigente(destino: string, proposito: 'registro' | 'login'): Promise<OtpRow | null>;
  incrementarIntentos(idCodigo: number): Promise<void>;
  marcarUsado(idCodigo: number): Promise<void>;
}
