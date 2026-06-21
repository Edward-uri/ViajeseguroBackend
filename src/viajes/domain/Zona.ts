export interface Zona {
  idZona: number;
  nombre: string;
  latCentro: number | null;
  lngCentro: number | null;
}

export interface TarifaZona {
  idZona: number;
  nombre: string;
  precio: number;
}

export interface ZonaAdmin {
  idZona: number;
  nombre: string;
  precio: number;
  latCentro: number | null;
  lngCentro: number | null;
  activo: boolean;
}
