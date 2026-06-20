export interface MunicipioPublico {
  idMunicipio: number;
  nombre: string;
  estado: string;
}

export class Municipio {
  constructor(
    public idMunicipio: number,
    public nombre: string,
    public estado: string,
    public activo: boolean,
  ) {}

  toPublicJSON(): MunicipioPublico {
    return { idMunicipio: this.idMunicipio, nombre: this.nombre, estado: this.estado };
  }
}

export class MunicipioBuilder {
  private _id?: number;
  private _nombre?: string;
  private _estado?: string;
  private _activo = true;

  idMunicipio(v: number): this { this._id = v; return this; }
  nombre(v: string): this { this._nombre = v; return this; }
  estado(v: string): this { this._estado = v; return this; }
  activo(v: boolean): this { this._activo = v; return this; }

  build(): Municipio {
    if (this._id == null || !this._nombre || !this._estado) {
      throw new Error('Municipio requiere idMunicipio, nombre y estado');
    }
    return new Municipio(this._id, this._nombre, this._estado, this._activo);
  }
}
