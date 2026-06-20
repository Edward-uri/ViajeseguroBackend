import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { IDocumentStorage } from '../../core/storage.js';

const ROOT = resolve(process.cwd(), 'uploads');

function rutaSegura(key: string): string {
  const full = resolve(ROOT, key);
  if (full !== ROOT && !full.startsWith(ROOT + (process.platform === 'win32' ? '\\' : '/'))) {
    throw new Error('key fuera de uploads/');
  }
  return full;
}

export class LocalDocumentStorage implements IDocumentStorage {
  async guardar({ key, contenido }: { key: string; contenido: Buffer }): Promise<void> {
    const full = rutaSegura(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, contenido);
  }

  async leer(key: string): Promise<Buffer> {
    return readFile(rutaSegura(key));
  }

  async borrar(key: string): Promise<void> {
    await unlink(rutaSegura(key));
  }
}
