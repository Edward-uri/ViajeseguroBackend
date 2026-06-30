import { pool } from '../../core/db.js';
import { cipherCodec } from './cipher.js';

/** Una tabla a cifrar: columnas planas (en el registro) + condición de "pendiente". */
interface TablaBackfill {
  tabla: string;
  idCol: string;
  campos: string[];
  /** SQL que selecciona filas aún sin cifrar (p.ej. `<campo>_bidx IS NULL`). */
  pendiente: string;
}

const TABLAS: TablaBackfill[] = [
  {
    tabla: 'usuarios', idCol: 'id_usuario', campos: ['correo_electronico', 'telefono'],
    pendiente: `(correo_electronico IS NOT NULL AND correo_electronico_bidx IS NULL)
             OR (telefono IS NOT NULL AND telefono_bidx IS NULL)`,
  },
  {
    tabla: 'invitaciones_admin', idCol: 'id_invitacion', campos: ['correo'],
    pendiente: `correo IS NOT NULL AND correo_bidx IS NULL`,
  },
  {
    tabla: 'codigos_otp', idCol: 'id_codigo', campos: ['destino'],
    pendiente: `destino IS NOT NULL AND destino_bidx IS NULL`,
  },
  {
    tabla: 'conductores', idCol: 'id_conductor', campos: ['licencia'],
    pendiente: `licencia IS NOT NULL AND licencia_bidx IS NULL`,
  },
  {
    tabla: 'vehiculos', idCol: 'id_vehiculo', campos: ['placa'],
    pendiente: `placa IS NOT NULL AND placa_bidx IS NULL`,
  },
  {
    tabla: 'propietarios', idCol: 'id_propietario', campos: ['rfc', 'razon_social'],
    pendiente: `(rfc IS NOT NULL AND rfc_bidx IS NULL) OR (razon_social IS NOT NULL AND razon_social_enc IS NULL)`,
  },
  {
    tabla: 'personas', idCol: 'id_persona',
    campos: ['nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento'],
    pendiente: `nombre IS NOT NULL AND nombre_enc IS NULL`,
  },
];

async function backfillTabla(t: TablaBackfill): Promise<number> {
  const { rows } = await pool.query(
    `SELECT ${t.idCol}, ${t.campos.join(', ')} FROM ${t.tabla} WHERE ${t.pendiente}`,
  );
  for (const r of rows as Record<string, unknown>[]) {
    const fila: Record<string, unknown> = {};
    for (const c of t.campos) fila[c] = r[c];
    const enc = cipherCodec.encodeParaInsert(t.tabla, fila); // solo deja claves *_enc/*_bidx
    const encCols = Object.keys(enc);
    const sets = [...t.campos.map((c) => `${c} = NULL`), ...encCols.map((k, i) => `${k} = $${i + 1}`)];
    const params = [...encCols.map((k) => enc[k]), r[t.idCol]];
    await pool.query(`UPDATE ${t.tabla} SET ${sets.join(', ')} WHERE ${t.idCol} = $${encCols.length + 1}`, params);
  }
  return rows.length;
}

/** Cifra la PII pendiente en todas las tablas configuradas. Idempotente. Se corre al arrancar. */
export async function backfillCifrado(): Promise<void> {
  for (const t of TABLAS) {
    const n = await backfillTabla(t);
    if (n) console.log(`[backfill] cifrados ${n} registro(s) en ${t.tabla}`);
  }
}
