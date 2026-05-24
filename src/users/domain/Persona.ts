export interface PersonaProps {
  idPersona?: number | null;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  idSexo?: number | null;
  correoElectronico: string;
  telefono?: string | null;
  fechaNacimiento?: string | null; 
}

/**
 * Entidad de dominio: Persona.
 * Datos personales asociados 1:1 a un Usuario (idPersona = idUsuario).
 */
export class Persona {
  public idPersona: number | null;
  public nombre: string;
  public apellidoPaterno: string;
  public apellidoMaterno: string | null;
  public idSexo: number | null;
  public correoElectronico: string;
  public telefono: string | null;
  public fechaNacimiento: string | null;

  constructor(props: PersonaProps) {
    this.idPersona = props.idPersona ?? null;
    this.nombre = props.nombre;
    this.apellidoPaterno = props.apellidoPaterno;
    this.apellidoMaterno = props.apellidoMaterno ?? null;
    this.idSexo = props.idSexo ?? null;
    this.correoElectronico = props.correoElectronico;
    this.telefono = props.telefono ?? null;
    this.fechaNacimiento = props.fechaNacimiento ?? null;
  }
}
