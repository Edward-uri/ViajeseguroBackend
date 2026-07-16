import type { RequestHandler } from 'express';
import { verifyAccessToken, type AuthTokenPayload } from '../core/jwt.js';
import { runConTenant } from '../core/tenantContext.js';
import { UnauthorizedError, ForbiddenError } from '../core/errors.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      tenant?: number | null;
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
    req.tenant = req.user.idMunicipio ?? null;
    const isAdmin = req.user.roles?.includes('admin') ?? false;
    runConTenant({ tenant: req.tenant, isAdmin }, () => next());
  } catch (err) {
    next(err);
  }
};


export function requireRole(...roles: NonNullable<AuthTokenPayload['roles']>): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    const userRoles = req.user.roles;
    if (!roles.some((r) => userRoles.includes(r))) {
      return next(new ForbiddenError());
    }
    next();
  };
}
