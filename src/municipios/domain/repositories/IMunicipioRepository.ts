import type { Municipio } from '../Municipio.js';

export interface IMunicipioRepository {
  listarActivos(): Promise<Municipio[]>;
  existeActivo(idMunicipio: number): Promise<boolean>;
}
