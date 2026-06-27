import type { ICipher } from './ICipher.js';
import { CipherPipeline, type Fila } from './CipherPipeline.js';
import { SENSITIVE_FIELDS, type FieldRegistry } from './sensitiveFields.js';

export class CipherCodec {
  private readonly pipeline: CipherPipeline;

  constructor(
    private readonly cipher: ICipher,
    private readonly registry: FieldRegistry = SENSITIVE_FIELDS,
  ) {
    this.pipeline = new CipherPipeline(cipher, registry);
  }

  /** Antes de INSERT/UPDATE: convierte campos sensibles a columnas _enc/_bidx. */
  encodeParaInsert(tabla: string, fila: Fila): Fila {
    return this.pipeline.cifrarFila(tabla, fila);
  }

  /** Después de SELECT: repone los valores planos desde las columnas _enc. */
  decodeDeRow(tabla: string, row: Fila): Fila {
    return this.pipeline.descifrarFila(tabla, row);
  }

  /** Borrado de cuenta: tombstone en _enc y null en _bidx. */
  anonimizar(tabla: string, fila: Fila): Fila {
    return this.pipeline.anonimizarFila(tabla, fila);
  }

  /** Calcula el blind index de un valor para construir un WHERE sobre <campo>_bidx. */
  bidx(tabla: string, campo: string, valor: string): string {
    const pol = this.registry[tabla]?.[campo];
    if (!pol?.blindIndex) {
      throw new Error(`El campo ${tabla}.${campo} no tiene blind index configurado`);
    }
    return this.cipher.blindIndex(valor);
  }
}
