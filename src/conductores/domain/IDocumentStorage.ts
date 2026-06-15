
export interface IDocumentStorage {
  guardar(args: { key: string; contenido: Buffer }): Promise<void>;
  leer(key: string): Promise<Buffer>;
  borrar(key: string): Promise<void>;
}
