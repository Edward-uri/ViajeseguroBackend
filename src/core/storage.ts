export interface IDocumentStorage {
  guardar(args: { key: string; contenido: Buffer }): Promise<void>;
  leer(key: string): Promise<Buffer>;
  borrar(key: string): Promise<void>;
}

/** mime aceptado -> extensión de archivo. */
export const MIME_PERMITIDOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

export const MAX_BYTES = 5 * 1024 * 1024;
