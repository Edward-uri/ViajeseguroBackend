import type { RequestHandler } from 'express';
import { verifyAccessToken, type AuthTokenPayload } from '../core/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../core/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token requerido'));
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
};


export function requireRole(...roles: AuthTokenPayload['rol'][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.rol)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
