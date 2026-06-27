import { createHash } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import { rateLimit, type Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../../core/env.js';
import { redis } from '../../infrastructure/redis.js';

function storePorDefecto(): Store | undefined {
  if (!redis) return undefined; 
  const client = redis;
  try {
    return new RedisStore({ prefix: 'rl:', sendCommand: (...args: string[]) => (client.call as (...a: string[]) => Promise<any>)(...args) });
  } catch (err) {
    console.warn('[rate-limit] RedisStore no disponible al arrancar, usando memoria:', err);
    return undefined;
  }
}

export function crearLimiter(opts: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  store?: Store;
}): RequestHandler {
  const limiter = rateLimit({
    windowMs: opts.windowMs,
    limit: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    store: opts.store ?? storePorDefecto(),
    keyGenerator: opts.keyGenerator,
    skip: opts.skip ?? (() => env.NODE_ENV === 'test'),
    handler: (_req, res) => {
      res.status(429).json({ error: 'demasiadas solicitudes', code: 'RATE_LIMITED' });
    },
  });
  // Fail-open: si el limiter llama next(err) por fallo del store, continuar.
  return (req, res, next) =>
    limiter(req, res, (err?: unknown) => {
      if (err) {
        console.warn('[rate-limit] store error, fail-open:', err);
        return next();
      }
      next();
    });
}

const mins = (m: number) => m * 60_000;

export const llaveDestino = (req: Request): string => {
  const raw = String((req.body?.correo ?? req.body?.telefono ?? '') as string);
  // Normalizar igual que el blind index (AesGcmCipher.blindIndex) para que variantes de
  // capitalizacion/espacios del mismo destino compartan la misma llave de rate-limit.
  const destino = raw.trim().toLowerCase();
  const h = createHash('sha256').update(destino).digest('hex').slice(0, 32);
  return `${req.ip ?? 'noip'}:${h}`;
};

export const authGlobal = crearLimiter({ windowMs: mins(env.RL_GLOBAL_WINDOW_MIN), max: env.RL_GLOBAL_MAX });
export const otpSendBurst = crearLimiter({ windowMs: mins(env.RL_OTP_SEND_BURST_WINDOW_MIN), max: env.RL_OTP_SEND_BURST_MAX, keyGenerator: llaveDestino });
export const otpSendHourly = crearLimiter({ windowMs: mins(env.RL_OTP_SEND_HOURLY_WINDOW_MIN), max: env.RL_OTP_SEND_HOURLY_MAX, keyGenerator: llaveDestino });
export const otpVerify = crearLimiter({ windowMs: mins(env.RL_OTP_VERIFY_WINDOW_MIN), max: env.RL_OTP_VERIFY_MAX });
export const passwordLogin = crearLimiter({ windowMs: mins(env.RL_PASSWORD_WINDOW_MIN), max: env.RL_PASSWORD_MAX });
