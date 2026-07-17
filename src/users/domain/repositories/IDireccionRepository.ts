export interface Direccion {
  idDireccion: number;
  etiqueta: string | null;
  lat: number | null;
  lng: number | null;
  texto: string | null;
  esFavorita: boolean;
}

export interface CrearDireccionInput {
  etiqueta: string | null;
  lat: number;
  lng: number;
  texto: string | null;
  esFavorita: boolean;
}

export interface IDireccionRepository {
  listar(idUsuario: number): Promise<Direccion[]>;
  crear(idUsuario: number, input: CrearDireccionInput): Promise<Direccion>;
  /** true si borró; false si no existía o no es del usuario. */
  eliminar(idUsuario: number, idDireccion: number): Promise<boolean>;
}
