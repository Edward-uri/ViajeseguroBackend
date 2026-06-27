import type { ICipher } from './ICipher.js';
import { SENSITIVE_FIELDS, type FieldRegistry, type FieldPolicy } from './sensitiveFields.js';

export type { FieldRegistry, FieldPolicy };
export type Fila = Record<string, unknown>;

const TOMBSTONE = '__ANONIMIZADO__';

export class CipherPipeline {
  constructor(
    private readonly cipher: ICipher,
    private readonly registry: FieldRegistry = SENSITIVE_FIELDS,
  ) {}

  private politicas(tabla: string): Record<string, FieldPolicy> {
    return this.registry[tabla] ?? {};
  }

  /** Escritura: cifra los campos `encrypt` a <campo>_enc, calcula <campo>_bidx y quita el campo plano. */
  cifrarFila(tabla: string, fila: Fila): Fila {
    const salida: Fila = { ...fila };
    for (const [campo, pol] of Object.entries(this.politicas(tabla))) {
      if (!(campo in fila)) continue;
      const valor = salida[campo];
      delete salida[campo];
      if (valor === null || valor === undefined) {
        if (pol.encrypt) salida[`${campo}_enc`] = null;
        if (pol.blindIndex) salida[`${campo}_bidx`] = null;
        continue;
      }
      const texto = String(valor);
      if (pol.encrypt) salida[`${campo}_enc`] = this.cipher.cifrar(texto);
      if (pol.blindIndex) salida[`${campo}_bidx`] = this.cipher.blindIndex(texto);
    }
    return salida;
  }

  /** Lectura: descifra <campo>_enc al campo plano y elimina las columnas técnicas. */
  descifrarFila(tabla: string, row: Fila): Fila {
    const salida: Fila = { ...row };
    for (const [campo, pol] of Object.entries(this.politicas(tabla))) {
      if (pol.encrypt) {
        const enc = salida[`${campo}_enc`];
        salida[campo] = enc === null || enc === undefined ? null : this.cipher.descifrar(String(enc));
        delete salida[`${campo}_enc`];
      }
      if (pol.blindIndex) delete salida[`${campo}_bidx`];
    }
    return salida;
  }

  /** Borrado: tombstone cifrado en <campo>_enc y null en <campo>_bidx. */
  anonimizarFila(tabla: string, fila: Fila): Fila {
    const salida: Fila = { ...fila };
    for (const [campo, pol] of Object.entries(this.politicas(tabla))) {
      delete salida[campo];
      if (pol.encrypt) salida[`${campo}_enc`] = this.cipher.cifrar(TOMBSTONE);
      if (pol.blindIndex) salida[`${campo}_bidx`] = null;
    }
    return salida;
  }
}
