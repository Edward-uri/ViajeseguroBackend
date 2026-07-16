import { pool, withTransaction } from '../../core/db.js';
import type {
  IEtiquetaRepository,
  EtiquetaCatalogo,
  EtiquetaAgregada,
  EvaluacionPendienteNlp,
  RolEtiqueta,
} from '../domain/repositories/IEtiquetaRepository.js';

/** Ventana de evaluaciones recientes sobre la que se calcula el perfil. */
const VENTANA_EVALUACIONES = 20;
/** Máximo de etiquetas mostradas en el perfil. */
const TOP_ETIQUETAS = 3;
/** Una negativa solo aparece con al menos estas ocurrencias dentro de la ventana. */
const MIN_OCURRENCIAS_NEGATIVA = 3;

export class EtiquetaPostgresRepository implements IEtiquetaRepository {
  async catalogoActivo(rol: RolEtiqueta): Promise<EtiquetaCatalogo[]> {
    const { rows } = await pool.query(
      `SELECT id_etiqueta, texto, descripcion, polaridad
         FROM etiquetas_catalogo WHERE rol = $1 AND activo`,
      [rol],
    );
    return rows.map((r) => ({
      id: Number(r.id_etiqueta),
      texto: r.texto,
      descripcion: r.descripcion,
      polaridad: r.polaridad,
    }));
  }

  async pendientesNlp(limite: number): Promise<EvaluacionPendienteNlp[]> {
    const { rows } = await pool.query(
      `SELECT id_evaluacion, tipo, calificacion, comentario
         FROM evaluaciones WHERE nlp_procesado_en IS NULL
        ORDER BY fecha ASC LIMIT $1`,
      [limite],
    );
    return rows.map((r) => ({
      idEvaluacion: Number(r.id_evaluacion),
      tipo: r.tipo,
      calificacion: Number(r.calificacion),
      comentario: r.comentario,
    }));
  }

  async marcarProcesada(idEvaluacion: number, idsEtiquetas: number[]): Promise<void> {
    await withTransaction(async (client) => {
      for (const idEtiqueta of idsEtiquetas) {
        await client.query(
          `INSERT INTO evaluacion_etiquetas (id_evaluacion, id_etiqueta)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [idEvaluacion, idEtiqueta],
        );
      }
      await client.query('UPDATE evaluaciones SET nlp_procesado_en = NOW() WHERE id_evaluacion = $1', [idEvaluacion]);
    });
  }

  async topDeUsuario(idUsuario: number, rol: RolEtiqueta): Promise<EtiquetaAgregada[]> {
    const tipo = rol === 'conductor' ? 'pasajero_a_conductor' : 'conductor_a_pasajero';
    const { rows } = await pool.query(
      `WITH ventana AS (
         SELECT id_evaluacion FROM evaluaciones
          WHERE id_evaluado = $1 AND tipo = $2
          ORDER BY fecha DESC LIMIT $3
       )
       SELECT c.id_etiqueta, c.texto, c.polaridad, COUNT(*)::int AS conteo
         FROM evaluacion_etiquetas ee
         JOIN ventana v ON v.id_evaluacion = ee.id_evaluacion
         JOIN etiquetas_catalogo c ON c.id_etiqueta = ee.id_etiqueta
        GROUP BY c.id_etiqueta, c.texto, c.polaridad
       HAVING c.polaridad = 'positiva' OR COUNT(*) >= $4
        ORDER BY conteo DESC, c.texto ASC
        LIMIT $5`,
      [idUsuario, tipo, VENTANA_EVALUACIONES, MIN_OCURRENCIAS_NEGATIVA, TOP_ETIQUETAS],
    );
    return rows.map((r) => ({
      id: Number(r.id_etiqueta),
      texto: r.texto,
      polaridad: r.polaridad,
      conteo: Number(r.conteo),
    }));
  }
}
