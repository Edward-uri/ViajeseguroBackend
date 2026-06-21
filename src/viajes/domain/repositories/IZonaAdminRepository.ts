import type { ZonaAdmin } from '../Zona.js';

export interface IZonaAdminRepository {
  listarAdmin(idMunicipio: number): Promise<ZonaAdmin[]>;
  crear(args: {
    idMunicipio: number;
    nombre: string;
    precio: number;
    latCentro: number | null;
    lngCentro: number | null;
  }): Promise<ZonaAdmin>;
  actualizar(args: {
    idZona: number;
    idMunicipio: number;
    nombre?: string;
    precio?: number;
    latCentro?: number | null;
    lngCentro?: number | null;
    activo?: boolean;
  }): Promise<ZonaAdmin | null>;
  desactivar(args: { idZona: number; idMunicipio: number }): Promise<boolean>;
}
