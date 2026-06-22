export type RolUsuario = 'pasajero' | 'conductor' | 'propietario' | 'admin';
export type EstadoCuenta = 'activo' | 'suspendido' | 'eliminado';

export interface PublicUser {
  idUsuario: number | null;
  telefono: string | null;
  correoElectronico: string;
  rol: RolUsuario;
  estadoCuenta: EstadoCuenta;
  telefonoVerificado: boolean;
  tienePassword: boolean;
  idMunicipio: number | null;
  fotoPerfilUrl: string | null;
  fechaRegistro: Date | null;
  esPropietario: boolean;
}

export class User {
  constructor(
    public idUsuario: number | null,
    public telefono: string | null,
    public correoElectronico: string,
    public rol: RolUsuario,
    public estadoCuenta: EstadoCuenta,
    public telefonoVerificado: boolean,
    public correoVerificado: boolean,
    public idMunicipio: number | null,
    public fotoPerfilUrl: string | null,
    public fotoPerfilS3Key: string | null,
    public fechaRegistro: Date | null,
    public tienePassword: boolean = false,
    public esPropietario: boolean = false,
  ) {}

  toPublicJSON(): PublicUser {
    return {
      idUsuario: this.idUsuario,
      telefono: this.telefono,
      correoElectronico: this.correoElectronico,
      rol: this.rol,
      estadoCuenta: this.estadoCuenta,
      telefonoVerificado: this.telefonoVerificado,
      tienePassword: this.tienePassword,
      idMunicipio: this.idMunicipio,
      fotoPerfilUrl: this.fotoPerfilUrl,
      fechaRegistro: this.fechaRegistro,
      esPropietario: this.esPropietario,
    };
  }
}

export class UserBuilder {
  private _id: number | null = null;
  private _telefono: string | null = null;
  private _correo?: string;
  private _rol: RolUsuario = 'pasajero';
  private _estado: EstadoCuenta = 'activo';
  private _telVerif = false;
  private _correoVerif = false;
  private _idMunicipio: number | null = null;
  private _fotoUrl: string | null = null;
  private _fotoKey: string | null = null;
  private _fechaRegistro: Date | null = null;
  private _tienePassword = false;
  private _esPropietario = false;

  idUsuario(v: number | null): this { this._id = v; return this; }
  telefono(v: string | null): this { this._telefono = v; return this; }
  correoElectronico(v: string): this { this._correo = v; return this; }
  rol(v: RolUsuario): this { this._rol = v; return this; }
  estadoCuenta(v: EstadoCuenta): this { this._estado = v; return this; }
  telefonoVerificado(v: boolean): this { this._telVerif = v; return this; }
  correoVerificado(v: boolean): this { this._correoVerif = v; return this; }
  idMunicipio(v: number | null): this { this._idMunicipio = v; return this; }
  fotoPerfilUrl(v: string | null): this { this._fotoUrl = v; return this; }
  fotoPerfilS3Key(v: string | null): this { this._fotoKey = v; return this; }
  fechaRegistro(v: Date | null): this { this._fechaRegistro = v; return this; }
  tienePassword(v: boolean): this { this._tienePassword = v; return this; }
  esPropietario(v: boolean): this { this._esPropietario = v; return this; }

  build(): User {
    if (!this._correo) throw new Error('User.correoElectronico es requerido');
    return new User(
      this._id, this._telefono, this._correo, this._rol, this._estado,
      this._telVerif, this._correoVerif, this._idMunicipio, this._fotoUrl, this._fotoKey, this._fechaRegistro, this._tienePassword, this._esPropietario,
    );
  }
}
