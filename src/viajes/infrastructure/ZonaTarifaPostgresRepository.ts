import { pool } from '../../core/db.js';
import type { Coordenada } from '../domain/tipos.js';
import type { IZonaTarifaRepository } from '../domain/repositories/IZonaTarifaRepository.js';
import type { TarifaZona } from '../domain/Zona.js';

export class ZonaTarifaPostgresRepository implements IZonaTarifaRepository {
  async listarPorMunicipio(idMunicipio: number): Promise<TarifaZona[]> {
    const { rows } = await pool.query<{ id_zona: string | number; nombre: string; precio: string }>(
      `SELECT z.id_zona, z.nombre, t.precio
         FROM zonas z JOIN tarifas t ON t.id_zona = z.id_zona AND t.vigente
        WHERE z.id_municipio = $1 AND z.activo
        ORDER BY t.precio, z.nombre`,
      [idMunicipio],
    );
    return rows.map((r) => ({ idZona: Number(r.id_zona), nombre: r.nombre, precio: Number(r.precio) }));
  }

  async tarifaDeZona(idZona: number): Promise<{ idMunicipio: number; precio: number } | null> {
    const { rows } = await pool.query<{ id_municipio: string | number; precio: string }>(
      'SELECT id_municipio, precio FROM tarifas WHERE id_zona = $1 AND vigente LIMIT 1',
      [idZona],
    );
    return rows[0] ? { idMunicipio: Number(rows[0].id_municipio), precio: Number(rows[0].precio) } : null;
  }

  async zonaMasCercana(idMunicipio: number, c: Coordenada): Promise<{ idZona: number; precio: number } | null> {
    const { rows } = await pool.query<{ id_zona: string | number; precio: string }>(
      `SELECT z.id_zona, t.precio,
              6371*2*ASIN(SQRT(POWER(SIN(RADIANS($2-z.lat_centro)/2),2)
                + COS(RADIANS(z.lat_centro))*COS(RADIANS($2))*POWER(SIN(RADIANS($3-z.lng_centro)/2),2))) AS dist
         FROM zonas z JOIN tarifas t ON t.id_zona = z.id_zona AND t.vigente
        WHERE z.id_municipio = $1 AND z.activo AND z.lat_centro IS NOT NULL
        ORDER BY dist ASC
        LIMIT 1`,
      [idMunicipio, c.lat, c.lng],
    );
    return rows[0] ? { idZona: Number(rows[0].id_zona), precio: Number(rows[0].precio) } : null;
  }
}
