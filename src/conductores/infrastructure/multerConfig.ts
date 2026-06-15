import multer from 'multer';
import { MIME_PERMITIDOS, MAX_BYTES } from '../domain/tipos.js';

export const subirArchivo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    cb(null, Boolean(MIME_PERMITIDOS[file.mimetype]));
  },
});
