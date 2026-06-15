import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../core/errors.js';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: err.flatten() },
    });
    return;
  }

  if ((err as { name?: string })?.name === 'MulterError') {
    res.status(400).json({
      error: { code: 'UPLOAD_ERROR', message: (err as Error).message },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  console.error('[ERROR no manejado]', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrio un error inesperado',
    },
  });
};
