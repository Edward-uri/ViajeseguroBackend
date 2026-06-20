import type { TipoDocumentoVehiculo, EstadoDocumento } from './tipos.js';

export class DocumentoVehiculo {
  constructor(
    public idDocumento: number | null,
    public idVehiculo: number,
    public tipo: TipoDocumentoVehiculo,
    public archivoKey: string,
    public nombreOriginal: string | null,
    public mimeType: string,
    public tamanoBytes: number,
    public estado: EstadoDocumento,
    public motivoRechazo: string | null,
    public revisadoPor: number | null,
    public revisadoEn: Date | null,
  ) {}

  toJSON(): {
    idDocumento: number | null;
    tipo: TipoDocumentoVehiculo;
    estado: EstadoDocumento;
    motivoRechazo: string | null;
    nombreOriginal: string | null;
    revisadoEn: Date | null;
  } {
    return {
      idDocumento: this.idDocumento,
      tipo: this.tipo,
      estado: this.estado,
      motivoRechazo: this.motivoRechazo,
      nombreOriginal: this.nombreOriginal,
      revisadoEn: this.revisadoEn,
    };
  }
}

export class DocumentoVehiculoBuilder {
  private _id: number | null = null;
  private _idVehiculo?: number;
  private _tipo?: TipoDocumentoVehiculo;
  private _archivoKey?: string;
  private _nombreOriginal: string | null = null;
  private _mimeType?: string;
  private _tamanoBytes?: number;
  private _estado: EstadoDocumento = 'pendiente';
  private _motivoRechazo: string | null = null;
  private _revisadoPor: number | null = null;
  private _revisadoEn: Date | null = null;

  idDocumento(v: number | null): this { this._id = v; return this; }
  idVehiculo(v: number): this { this._idVehiculo = v; return this; }
  tipo(v: TipoDocumentoVehiculo): this { this._tipo = v; return this; }
  archivoKey(v: string): this { this._archivoKey = v; return this; }
  nombreOriginal(v: string | null): this { this._nombreOriginal = v; return this; }
  mimeType(v: string): this { this._mimeType = v; return this; }
  tamanoBytes(v: number): this { this._tamanoBytes = v; return this; }
  estado(v: EstadoDocumento): this { this._estado = v; return this; }
  motivoRechazo(v: string | null): this { this._motivoRechazo = v; return this; }
  revisadoPor(v: number | null): this { this._revisadoPor = v; return this; }
  revisadoEn(v: Date | null): this { this._revisadoEn = v; return this; }

  build(): DocumentoVehiculo {
    if (this._idVehiculo == null || !this._tipo || !this._archivoKey || !this._mimeType || this._tamanoBytes == null) {
      throw new Error('DocumentoVehiculo requiere idVehiculo, tipo, archivoKey, mimeType y tamanoBytes');
    }
    return new DocumentoVehiculo(
      this._id, this._idVehiculo, this._tipo, this._archivoKey, this._nombreOriginal,
      this._mimeType, this._tamanoBytes, this._estado, this._motivoRechazo, this._revisadoPor, this._revisadoEn,
    );
  }
}
