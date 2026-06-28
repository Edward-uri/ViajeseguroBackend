import type { RequestHandler } from 'express';
import { env } from '../../core/env.js';
import { renderPaginaEliminarCuenta } from './eliminarCuentaPage.js';

const html = renderPaginaEliminarCuenta(env.SUPPORT_EMAIL);

export const eliminarCuentaController: RequestHandler = (_req, res) => {
  res.type('html').send(html);
};
