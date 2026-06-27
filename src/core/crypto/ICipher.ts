export interface ICipher {
  /** Cifra texto. Devuelve "v1:" + base64(iv | tag | ciphertext). */
  cifrar(textoPlano: string): string;
  /** Descifra un blob de `cifrar`. Lanza CipherError si está manipulado o corrupto. */
  descifrar(blob: string): string;
  /** Cifra bytes (documentos). Devuelve [versión | iv | tag | ciphertext]. */
  cifrarBytes(contenido: Buffer): Buffer;
  /** Descifra un buffer de `cifrarBytes`. Lanza CipherError si está manipulado. */
  descifrarBytes(blob: Buffer): Buffer;
  /** Índice ciego determinista (HMAC) para búsqueda por igualdad. No reversible. */
  blindIndex(valor: string): string;
}
