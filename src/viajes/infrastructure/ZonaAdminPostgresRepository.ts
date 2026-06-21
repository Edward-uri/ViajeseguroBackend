import { pool, withTransaction } from '../../core/db.js';
import type { IZonaAdminRepository } from '../domain/repositories/IZonaAdminRepository.js';
import type { ZonaAdmin } from '../domain/Zona.js';
import { ZonaNombreDuplicadoError, MunicipioNoEncontradoError } from '../domain/errors.js';

interface ZonaAdminRow {
  id_zona: string | number;
  nombre: string;
  precio: string;
  lat_centro: string | number | null;
  lng_centro: string | number | null;
  activo: boolean;
}

function mapRow(r: ZonaAdminRow): ZonaAdmin {
  return {
    idZona: Number(r.id_zona),
    nombre: r.nombre,
    precio: Number(r.precio),
    latCentro: r.lat_centro == null ? null : Number(r.lat_centro),
    lngCentro: r.lng_centro == null ? null : Number(r.lng_centro),
    activo: r.activo,
  };
}

export class ZonaAdminPostgresRepository implements IZonaAdminRepository {
  async listarAdmin(idMunicipio: number): Promise<ZonaAdmin[]> {
    const { rows } = await pool.query<ZonaAdminRow>(
      `SELECT z.id_zona, z.nombre, t.precio, z.lat_centro, z.lng_centro, z.activo
         FROM zonas z JOIN tarifas t ON t.id_zona = z.id_zona AND t.vigente
        WHERE z.id_municipio = $1
        ORDER BY z.activo DESC, z.nombre ASC`,
      [idMunicipio],
    );
    return rows.map(mapRow);
  }

  async crear(args: {
    idMunicipio: number; nombre: string; precio: number;
    latCentro: number | null; lngCentro: number | null;
  }): Promise<ZonaAdmin> {
    try {
      return await withTransaction(async (client) => {
        const { rows: zRows } = await client.query<{
          id_zona: string | number; lat_centro: string | number | null;
          lng_centro: string | number | null; activo: boolean;
        }>(
          `INSERT INTO zonas (id_municipio, nombre, lat_centro, lng_centro, activo)
           VALUES ($1, $2, $3, $4, TRUE)
           RETURNING id_zona, lat_centro, lng_centro, activo`,
          [args.idMunicipio, args.nombre, args.latCentro, args.lngCentro],
        );
        const z = zRows[0]!;
        const idZona = Number(z.id_zona);
        const { rows: tRows } = await client.query<{ precio: string }>(
          `INSERT INTO tarifas (id_municipio, id_zona, precio, vigente)
           VALUES ($1, $2, $3, TRUE) RETURNING precio`,
          [args.idMunicipio, idZona, args.precio],
        );
        return {
          idZona,
          nombre: args.nombre,
          precio: Number(tRows[0]!.precio),
          latCentro: z.lat_centro == null ? null : Number(z.lat_centro),
          lngCentro: z.lng_centro == null ? null : Number(z.lng_centro),
          activo: z.activo,
        };
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === '23505') throw new ZonaNombreDuplicadoError(args.nombre);
      if (code === '23503') throw new MunicipioNoEncontradoError();
      throw e;
    }
  }

  async actualizar(args: {
    idZona: number; idMunicipio: number;
    nombre?: string; precio?: number;
    latCentro?: number | null; lngCentro?: number | null; activo?: boolean;
  }): Promise<ZonaAdmin | null> {
    try {
      return await withTransaction(async (client) => {
        const { rows: exist } = await client.query<{ id_zona: string | number }>(
          `SELECT id_zona FROM zonas WHERE id_zona = $1 AND id_municipio = $2 FOR UPDATE`,
          [args.idZona, args.idMunicipio],
        );
        if (exist.length === 0) return null;

        await client.query(
          `UPDATE zonas
              SET nombre = COALESCE($1, nombre),
                  lat_centro = COALESCE($2, lat_centro),
                  lng_centro = COALESCE($3, lng_centro),
                  activo = COALESCE($4, activo)
            WHERE id_zona = $5 AND id_municipio = $6`,
          [
            args.nombre ?? null, args.latCentro ?? null, args.lngCentro ?? null,
            args.activo ?? null, args.idZona, args.idMunicipio,
          ],
        );

        if (args.precio !== undefined) {
          await client.query(
            `UPDATE tarifas SET precio = $1 WHERE id_zona = $2 AND vigente`,
            [args.precio, args.idZona],
          );
        }

        const { rows } = await client.query<ZonaAdminRow>(
          `SELECT z.id_zona, z.nombre, t.precio, z.lat_centro, z.lng_centro, z.activo
             FROM zonas z JOIN tarifas t ON t.id_zona = z.id_zona AND t.vigente
            WHERE z.id_zona = $1`,
          [args.idZona],
        );
        return mapRow(rows[0]!);
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === '23505') throw new ZonaNombreDuplicadoError(args.nombre ?? '');
      throw e;
    }
  }

  async desactivar(args: { idZona: number; idMunicipio: number }): Promise<boolean> {
    const { rowCount } = await pool.query(
      `UPDATE zonas SET activo = FALSE WHERE id_zona = $1 AND id_municipio = $2`,
      [args.idZona, args.idMunicipio],
    );
    return (rowCount ?? 0) > 0;
  }
}
