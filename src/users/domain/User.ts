export type RolUsuario = 'pasajero' | 'conductor' | 'propietario' | 'admin';
export type EstadoCuenta = 'activo' | 'suspendido' | 'eliminado';

export interface UserProps {
  idUsuario?: number | null;
  nombreUsuario: string;
  passwordHash: string;
  rol: RolUsuario;
  estadoCuenta?: EstadoCuenta;
  fechaRegistro?: Date | null;
  fotoPerfilUrl?: string | null;
  fotoPerfilS3Key?: string | null;
}

export interface PublicUser {
  idUsuario: number | null;
  nombreUsuario: string;
  rol: RolUsuario;
  estadoCuenta: EstadoCuenta;
  fechaRegistro: Date | null;
  fotoPerfilUrl: string | null;
}

/**
 * Entidad de dominio: Usuario.
 * Reprenta credenciales y metadatos de cuenta.
 * No contiene logica de persistencia.
 */
export class User {
  public idUsuario: number | null;
  public nombreUsuario: string;
  public passwordHash: string;
  public rol: RolUsuario;
  public estadoCuenta: EstadoCuenta;
  public fechaRegistro: Date | null;
  public fotoPerfilUrl: string | null;
  public fotoPerfilS3Key: string | null;

  constructor(props: UserProps) {
    this.idUsuario = props.idUsuario ?? null;
    this.nombreUsuario = props.nombreUsuario;
    this.passwordHash = props.passwordHash;
    this.rol = props.rol;
    this.estadoCuenta = props.estadoCuenta ?? 'activo';
    this.fechaRegistro = props.fechaRegistro ?? null;
    this.fotoPerfilUrl = props.fotoPerfilUrl ?? null;
    this.fotoPerfilS3Key = props.fotoPerfilS3Key ?? null;
  }

  toPublicJSON(): PublicUser {
    return {
      idUsuario: this.idUsuario,
      nombreUsuario: this.nombreUsuario,
      rol: this.rol,
      estadoCuenta: this.estadoCuenta,
      fechaRegistro: this.fechaRegistro,
      fotoPerfilUrl: this.fotoPerfilUrl,
    };
  }
}
