import { createHash } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import { rateLimit, type Store } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../../core/env.js';
import { redis } from '../../infrastructure/redis.js';

function storePorDefecto(prefix: string): Store | undefined {
  if (!redis) return undefined;
  const client = redis;
  try {
    const store = new RedisStore({ prefix, sendCommand: (...args: string[]) => (client.call as (...a: string[]) => Promise<any>)(...args) });
    // rate-limit-redis dispara SCRIPT LOAD en su constructor (loadIncrementScript/loadGetScript)
    // y guarda los promises sin capturar el rejection. Si Redis esta caido al arrancar, quedan
    // como "unhandled rejection" y Node tumba el proceso (fuera del alcance del fail-open del
    // middleware). Les colgamos un catch no-op: el reintento real del script ocurre despues
    // dentro de increment()/get() con su propio try/catch, y si Redis sigue caido el wrapper
    // fail-open de crearLimiter deja pasar la peticion.
    const s = store as unknown as { incrementScriptSha?: Promise<unknown>; getScriptSha?: Promise<unknown> };
    s.incrementScriptSha?.catch?.(() => {});
    s.getScriptSha?.catch?.(() => {});
    return store;
  } catch (err) {
    console.warn('[rate-limit] RedisStore no disponible al arrancar, usando memoria:', err);
    return undefined;
  }
}

export function crearLimiter(opts: {
  prefix: string;
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
    store: opts.store ?? storePorDefecto(opts.prefix),
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
  const destino = raw.trim().toLowerCase();
  const h = createHash('sha256').update(destino).digest('hex').slice(0, 32);
  return `${req.ip ?? 'noip'}:${h}`;
};

export const authGlobal = crearLimiter({ prefix: 'rl:global:', windowMs: mins(env.RL_GLOBAL_WINDOW_MIN), max: env.RL_GLOBAL_MAX });
export const otpSendBurst = crearLimiter({ prefix: 'rl:otp_burst:', windowMs: mins(env.RL_OTP_SEND_BURST_WINDOW_MIN), max: env.RL_OTP_SEND_BURST_MAX, keyGenerator: llaveDestino });
export const otpSendHourly = crearLimiter({ prefix: 'rl:otp_hourly:', windowMs: mins(env.RL_OTP_SEND_HOURLY_WINDOW_MIN), max: env.RL_OTP_SEND_HOURLY_MAX, keyGenerator: llaveDestino });
export const otpVerify = crearLimiter({ prefix: 'rl:otp_verify:', windowMs: mins(env.RL_OTP_VERIFY_WINDOW_MIN), max: env.RL_OTP_VERIFY_MAX });
export const passwordLogin = crearLimiter({ prefix: 'rl:pwd:', windowMs: mins(env.RL_PASSWORD_WINDOW_MIN), max: env.RL_PASSWORD_MAX });
