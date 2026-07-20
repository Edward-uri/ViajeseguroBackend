import { pool } from '../../core/db.js';
import { ConflictError } from '../../core/errors.js';
import type { PerimetroGeoJSON } from '../domain/IPerimetroProvider.js';
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

  async crear(args: { nombre: string; estado: string; tarifaDefault?: number }): Promise<Municipio> {
    try {
      const { rows } = await pool.query<Row>(
        `INSERT INTO municipios (nombre, estado, tarifa_default)
         VALUES ($1, $2, COALESCE($3, 15.00)) RETURNING *`,
        [args.nombre, args.estado, args.tarifaDefault ?? null],
      );
      return map(rows[0]!);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') throw new ConflictError('Ese municipio ya existe');
      throw err;
    }
  }

  async guardarPerimetro(idMunicipio: number, perimetro: PerimetroGeoJSON): Promise<void> {
    await pool.query('UPDATE municipios SET perimetro = $2 WHERE id_municipio = $1', [idMunicipio, perimetro]);
  }

  async perimetroDe(idMunicipio: number): Promise<{ type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } | null> {
    const { rows } = await pool.query<{ perimetro: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } | null }>(
      'SELECT perimetro FROM municipios WHERE id_municipio = $1',
      [idMunicipio],
    );
    return rows[0]?.perimetro ?? null;
  }
}
