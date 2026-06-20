export interface PropietarioPublico {
  idPropietario: number;
  rfc: string | null;
  razonSocial: string | null;
}

export class Propietario {
  constructor(
    public idPropietario: number,
    public rfc: string | null,
    public razonSocial: string | null,
  ) {}

  toJSON(): PropietarioPublico {
    return { idPropietario: this.idPropietario, rfc: this.rfc, razonSocial: this.razonSocial };
  }
}

export class PropietarioBuilder {
  private _id?: number;
  private _rfc: string | null = null;
  private _razonSocial: string | null = null;

  idPropietario(v: number): this { this._id = v; return this; }
  rfc(v: string | null): this { this._rfc = v; return this; }
  razonSocial(v: string | null): this { this._razonSocial = v; return this; }

  build(): Propietario {
    if (this._id == null) throw new Error('Propietario.idPropietario es requerido');
    return new Propietario(this._id, this._rfc, this._razonSocial);
  }
}
