import { pool } from '../../core/db.js';
import { Municipio, MunicipioBuilder } from '../domain/Municipio.js';
import type { IMunicipioRepository } from '../domain/repositories/IMunicipioRepository.js';

interface Row {
  id_municipio: string | number;
  nombre: string;
  estado: string;
  activo: boolean;
}

function map(row: Row): Municipio {
  return new MunicipioBuilder()
    .idMunicipio(Number(row.id_municipio))
    .nombre(row.nombre)
    .estado(row.estado)
    .activo(row.activo)
    .build();
}

export class MunicipioPostgresRepository implements IMunicipioRepository {
  async listarActivos(): Promise<Municipio[]> {
    const { rows } = await pool.query<Row>(
      'SELECT * FROM municipios WHERE activo = TRUE ORDER BY estado, nombre',
    );
    return rows.map(map);
  }

  async existeActivo(idMunicipio: number): Promise<boolean> {
    const { rowCount } = await pool.query(
      'SELECT 1 FROM municipios WHERE id_municipio = $1 AND activo = TRUE',
      [idMunicipio],
    );
    return rowCount === 1;
  }
}
