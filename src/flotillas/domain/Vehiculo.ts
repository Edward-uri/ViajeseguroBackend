export interface VehiculoPublico {
  idVehiculo: number;
  idPropietario: number;
  placa: string;
  numeroSerie: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  idMunicipio: number;
}

export class Vehiculo {
  constructor(
    public idVehiculo: number,
    public idPropietario: number,
    public placa: string,
    public numeroSerie: string | null,
    public modelo: string | null,
    public color: string | null,
    public anio: number | null,
    public idMunicipio: number,
  ) {}

  toJSON(): VehiculoPublico {
    return {
      idVehiculo: this.idVehiculo,
      idPropietario: this.idPropietario,
      placa: this.placa,
      numeroSerie: this.numeroSerie,
      modelo: this.modelo,
      color: this.color,
      anio: this.anio,
      idMunicipio: this.idMunicipio,
    };
  }
}

export class VehiculoBuilder {
  private _id?: number;
  private _idPropietario?: number;
  private _placa?: string;
  private _numeroSerie: string | null = null;
  private _modelo: string | null = null;
  private _color: string | null = null;
  private _anio: number | null = null;
  private _idMunicipio?: number;

  idVehiculo(v: number): this { this._id = v; return this; }
  idPropietario(v: number): this { this._idPropietario = v; return this; }
  placa(v: string): this { this._placa = v; return this; }
  numeroSerie(v: string | null): this { this._numeroSerie = v; return this; }
  modelo(v: string | null): this { this._modelo = v; return this; }
  color(v: string | null): this { this._color = v; return this; }
  anio(v: number | null): this { this._anio = v; return this; }
  idMunicipio(v: number): this { this._idMunicipio = v; return this; }

  build(): Vehiculo {
    if (this._id == null || this._idPropietario == null || !this._placa || this._idMunicipio == null) {
      throw new Error('Vehiculo requiere idVehiculo, idPropietario, placa e idMunicipio');
    }
    return new Vehiculo(this._id, this._idPropietario, this._placa, this._numeroSerie, this._modelo, this._color, this._anio, this._idMunicipio);
  }
}
