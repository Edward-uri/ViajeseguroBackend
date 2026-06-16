export class Conductor {
  constructor(
    public idConductor: number,
    public idMunicipio: number | null,
    public licencia: string | null,
    public licenciaFechaExpedicion: string | null,
    public licenciaFechaVencimiento: string | null,
  ) {}
}

export class ConductorBuilder {
  private _id?: number;
  private _idMunicipio: number | null = null;
  private _licencia: string | null = null;
  private _exp: string | null = null;
  private _venc: string | null = null;

  idConductor(v: number): this { this._id = v; return this; }
  idMunicipio(v: number | null): this { this._idMunicipio = v; return this; }
  licencia(v: string | null): this { this._licencia = v; return this; }
  licenciaFechaExpedicion(v: string | null): this { this._exp = v; return this; }
  licenciaFechaVencimiento(v: string | null): this { this._venc = v; return this; }

  build(): Conductor {
    if (this._id == null) throw new Error('Conductor.idConductor es requerido');
    return new Conductor(this._id, this._idMunicipio, this._licencia, this._exp, this._venc);
  }
}
