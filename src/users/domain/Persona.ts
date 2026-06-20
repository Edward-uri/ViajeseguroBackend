export class Persona {
  constructor(
    public idPersona: number | null,
    public nombre: string,
    public apellidoPaterno: string,
    public apellidoMaterno: string | null,
    public idSexo: number | null,
    public fechaNacimiento: string | null,
  ) {}
}

export class PersonaBuilder {
  private _id: number | null = null;
  private _nombre?: string;
  private _apP?: string;
  private _apM: string | null = null;
  private _idSexo: number | null = null;
  private _fechaNac: string | null = null;

  idPersona(v: number | null): this { this._id = v; return this; }
  nombre(v: string): this { this._nombre = v; return this; }
  apellidoPaterno(v: string): this { this._apP = v; return this; }
  apellidoMaterno(v: string | null): this { this._apM = v; return this; }
  idSexo(v: number | null): this { this._idSexo = v; return this; }
  fechaNacimiento(v: string | null): this { this._fechaNac = v; return this; }

  build(): Persona {
    if (!this._nombre || !this._apP) throw new Error('Persona requiere nombre y apellidoPaterno');
    return new Persona(this._id, this._nombre, this._apP, this._apM, this._idSexo, this._fechaNac);
  }
}
