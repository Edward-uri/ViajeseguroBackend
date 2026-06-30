import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z
    .string()
    .default('true')
    .transform((v) => v === 'true' || v === '1'),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ACCESS_TOKEN_TTL: z.string().default('30m'),
  REFRESH_TOKEN_TTL: z.string().default('60d'),
  REGISTRATION_TOKEN_TTL: z.string().default('15m'),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),

  /** Carpeta donde LocalDocumentStorage guarda documentos y fotos de perfil. En prod = punto de montaje del volumen de Coolify (ej. /app/uploads). Default: <cwd>/uploads. */
  UPLOADS_DIR: z.string().min(1).optional(),

  BREVO_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().default('noreply@codigoverse.space'),
  EMAIL_FROM_NAME: z.string().min(1).default('Jala'),
  BREVO_TEMPLATE_ID: z.coerce.number().int().positive().optional(),
  ADMIN_PANEL_URL: z.string().url().default('http://localhost:5173'),
  BREVO_INVITE_TEMPLATE_ID: z.coerce.number().int().positive().optional(),
  INVITE_TTL_DAYS: z.coerce.number().int().positive().default(7),

  /** Correo de soporte mostrado en la página pública /eliminar-cuenta (requisito de Google Play). */
  SUPPORT_EMAIL: z.string().email().default('soporte@codigoverse.space'),

  SOCKET_CORS_ORIGIN: z.string().default('*'),
  FCM_SERVICE_ACCOUNT: z.string().min(1).optional(),

  /** URL de OSRM self-hosted (red interna, ej. http://osrm:5000). Vacío = solo Haversine. */
  OSRM_URL: z.string().url().optional(),

  /** URL de Redis para el rate-limiting (ej. redis://redis:6379). Sin ella: rate-limit en memoria. */
  REDIS_URL: z.string().url().optional(),

  // Rate-limiting (ventanas en minutos, max = nº de peticiones por ventana)
  RL_GLOBAL_WINDOW_MIN: z.coerce.number().positive().default(15),
  RL_GLOBAL_MAX: z.coerce.number().int().positive().default(100),
  RL_OTP_SEND_BURST_WINDOW_MIN: z.coerce.number().positive().default(1),
  RL_OTP_SEND_BURST_MAX: z.coerce.number().int().positive().default(1),
  RL_OTP_SEND_HOURLY_WINDOW_MIN: z.coerce.number().positive().default(60),
  RL_OTP_SEND_HOURLY_MAX: z.coerce.number().int().positive().default(5),
  RL_OTP_VERIFY_WINDOW_MIN: z.coerce.number().positive().default(10),
  RL_OTP_VERIFY_MAX: z.coerce.number().int().positive().default(10),
  RL_PASSWORD_WINDOW_MIN: z.coerce.number().positive().default(15),
  RL_PASSWORD_MAX: z.coerce.number().int().positive().default(10),

  /** Llave AES-256 (32 bytes en base64) para cifrar PII. Sin ella la app no arranca fuera de test. */
  CIPHER_KEY: z.string().min(1).optional(),
  /** Llave HMAC (32 bytes en base64) para el blind index. Debe ser distinta de CIPHER_KEY. */
  CIPHER_INDEX_KEY: z.string().min(1).optional(),

  /** URL del modelo de zonas calientes (proxy server-to-server, evita CORS en web). */
  ZONAS_URL: z.string().url().default('https://zonas.codigoverse.space'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno invalidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
