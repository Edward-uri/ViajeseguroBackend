export interface IDocumentStorage {
  guardar(args: { key: string; contenido: Buffer }): Promise<void>;
  leer(key: string): Promise<Buffer>;
  borrar(key: string): Promise<void>;
}

/** mime aceptado -> extensión de archivo. */
export const MIME_PERMITIDOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

/** Extensión de archivo -> mime, para servir un archivo guardado por su key. */
export const MIME_POR_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

export const MAX_BYTES = 5 * 1024 * 1024;
